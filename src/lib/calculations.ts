export type AnimalType = 'broilers' | 'swine-sow' | 'swine-nursery' | 'swine-grow-finish';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year
  feedCrudeProtein: number; // percentage (used for swine or as fallback)
  broilerCPStarter?: number; // Broiler specific phase 1
  broilerCPGrower?: number;  // Broiler specific phase 2
  broilerCPFinisher?: number; // Broiler specific phase 3
  feedPhosphorus: number; // percentage (used for swine or as fallback)
  broilerPStarter?: number; // Broiler specific phase 1
  broilerPGrower?: number;  // Broiler specific phase 2
  broilerPFinisher?: number; // Broiler specific phase 3
  manureManagement: 'lagoon' | 'solid' | 'slurry' | 'dry-lot';
  avgWeight: number; // kg (target market weight at end of cycle)
  additive: FeedAdditive;
}

export interface EmissionResults {
  nitrogenExcreted: number; // kg/cycle
  phosphorusExcreted: number; // kg/cycle
  entericMethane: number; // kg CH4/cycle
  manureMethane: number; // kg CH4/cycle
  phosphorusRunoff: number; // kg/cycle
  directN2O: number; // kg N2O/cycle
  indirectN2O: number; // kg N2O/cycle
  totalCarbonEquivalent: number; // kg CO2e/cycle
}

export interface ComparativeResults {
  baseline: EmissionResults;
  scenario: EmissionResults;
  additiveType: FeedAdditive;
}

/**
 * Calculates farm emissions per production cycle based on phase-specific mass balance.
 * 
 * NITROGEN EQUATIONS (Per Phase -> Total Cycle):
 * 1. Phase Intake = (Phase Feed Intake * Phase CP%) / 6.25
 * 2. Phase Retention = (29g/kg * Phase Weight Gain) / 1000 * Count
 * 3. Total Excretion = (Σ Intake) - (Σ Retention)
 * 
 * PHOSPHORUS EQUATIONS (Per Phase -> Total Cycle):
 * 1. Phase Intake = (Phase Feed Intake * Phase P%) / 100
 * 2. Phase Retention = (0.6% * Phase Weight Gain) / 100 * Count  => (6g/kg * Phase Weight Gain) / 1000 * Count
 * 3. Total Excretion = (Σ Intake) - (Σ Retention)
 * 
 * BROILER PHASE PARTITIONING (Standard 42-day cycle):
 * - Feed Intake & Weight Gain: Starter (14%), Grower (45%), Finisher (41%)
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { 
    count, fcr, 
    broilerCPStarter, broilerCPGrower, broilerCPFinisher,
    broilerPStarter, broilerPGrower, broilerPFinisher,
    feedCrudeProtein, feedPhosphorus,
    animalType, manureManagement, avgWeight, additive 
  } = data;
  
  // Total cycle metrics
  const totalFeedPerCycle = count * fcr * avgWeight;
  const totalGain = avgWeight; // Simplified: Gain = Final weight for the batch

  // Additive logic: Metabolic efficiency improvements
  // These factors model the reduction in excretion/gas production independent of FCR
  let metabolicNMitigation = 1.0;
  let metabolicPMitigation = 1.0;
  let ch4MitigationFactor = 1.0;

  if (useAdditive && additive !== 'none') {
    if (additive === 'jefo-pro') {
      metabolicNMitigation = 0.95; // 5% metabolic N reduction
      metabolicPMitigation = 0.98; // 2% metabolic P reduction
      ch4MitigationFactor = 0.95;  // 5% methane suppression
    } else if (additive === 'poa-eo') {
      metabolicNMitigation = 0.92; // 8% metabolic N reduction
      metabolicPMitigation = 0.95; // 5% metabolic P reduction
      ch4MitigationFactor = 0.88;  // 12% methane suppression
    }
  }

  let totalNitrogenIntake = 0;
  let totalNitrogenRetention = 0;
  let totalPhosphorusIntake = 0;
  let totalPhosphorusRetention = 0;

  if (animalType === 'broilers' && 
      broilerCPStarter !== undefined && broilerCPGrower !== undefined && broilerCPFinisher !== undefined &&
      broilerPStarter !== undefined && broilerPGrower !== undefined && broilerPFinisher !== undefined) {
    
    // Distribution for a 42-day broiler cycle (both feed and weight gain aligned)
    const phaseDist = { starter: 0.14, grower: 0.45, finisher: 0.41 };

    // --- PHASE 1: STARTER ---
    const sFeed = totalFeedPerCycle * phaseDist.starter;
    const sGain = totalGain * phaseDist.starter;
    const sNIntake = (sFeed * broilerCPStarter / 100) / 6.25;
    const sNRetention = (29 * sGain / 1000) * count; 
    const sPIntake = sFeed * (broilerPStarter / 100);
    const sPRetention = (6 * sGain / 1000) * count; // 0.6% P retention

    // --- PHASE 2: GROWER ---
    const gFeed = totalFeedPerCycle * phaseDist.grower;
    const gGain = totalGain * phaseDist.grower;
    const gNIntake = (gFeed * broilerCPGrower / 100) / 6.25;
    const gNRetention = (29 * gGain / 1000) * count;
    const gPIntake = gFeed * (broilerPGrower / 100);
    const gPRetention = (6 * gGain / 1000) * count;

    // --- PHASE 3: FINISHER ---
    const fFeed = totalFeedPerCycle * phaseDist.finisher;
    const fGain = totalGain * phaseDist.finisher;
    const fNIntake = (fFeed * broilerCPFinisher / 100) / 6.25;
    const fNRetention = (29 * fGain / 1000) * count;
    const fPIntake = fFeed * (broilerPFinisher / 100);
    const fPRetention = (6 * fGain / 1000) * count;

    // Sum of phases to get total cycle mass balance
    totalNitrogenIntake = sNIntake + gNIntake + fNIntake;
    totalNitrogenRetention = sNRetention + gNRetention + fNRetention;
    totalPhosphorusIntake = sPIntake + gPIntake + fPIntake;
    totalPhosphorusRetention = sPRetention + gPRetention + fPRetention;

  } else {
    // Single phase fallback (Swine)
    totalNitrogenIntake = (totalFeedPerCycle * (feedCrudeProtein / 100)) / 6.25;
    totalNitrogenRetention = (29 * avgWeight / 1000) * count;
    
    totalPhosphorusIntake = totalFeedPerCycle * (feedPhosphorus / 100);
    const swinePRetentionFactor = 5; // g/kg
    totalPhosphorusRetention = (swinePRetentionFactor * avgWeight / 1000) * count;
  }

  // --- EXCRETION CALCULATION ---
  const baseNitrogenExcreted = Math.max(0, totalNitrogenIntake - totalNitrogenRetention);
  const totalNitrogenExcreted = baseNitrogenExcreted * metabolicNMitigation;

  const basePhosphorusExcreted = Math.max(0, totalPhosphorusIntake - totalPhosphorusRetention);
  const totalPhosphorusExcreted = basePhosphorusExcreted * metabolicPMitigation;

  // --- METHANE CALCULATIONS (Per Cycle) ---
  const cycleDays = {
    'broilers': 42,
    'swine-sow': 365,
    'swine-nursery': 49,
    'swine-grow-finish': 115
  }[animalType] || 42;

  let entericMultiplier = 0.03;
  if (animalType === 'swine-sow') entericMultiplier = 0.05;
  if (animalType === 'swine-nursery') entericMultiplier = 0.015;

  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * entericMultiplier / 365);
  // Applied ch4MitigationFactor here
  const totalEntericMethane = entericEmissionFactor * count * cycleDays * ch4MitigationFactor;

  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  // Applied ch4MitigationFactor here as well
  const manureMethane = vsPerDay * count * cycleDays * mcf * 0.6 * ch4MitigationFactor;

  // --- OTHER METRICS ---
  const totalPhosphorusRunoff = totalPhosphorusExcreted * 0.05;

  const directN2oFactor = {
    'lagoon': 0.005,
    'solid': 0.02,
    'slurry': 0.005,
    'dry-lot': 0.01
  }[manureManagement] || 0.01;
  
  const directN2O = totalNitrogenExcreted * directN2oFactor * (44 / 28);
  const indirectN2O = totalNitrogenExcreted * 0.01 * (44 / 28);

  const totalCarbonEquivalent = 
    (totalEntericMethane + manureMethane) * 28 + 
    (directN2O + indirectN2O) * 265;

  return {
    nitrogenExcreted: totalNitrogenExcreted,
    phosphorusExcreted: totalPhosphorusExcreted,
    entericMethane: totalEntericMethane,
    manureMethane,
    phosphorusRunoff: totalPhosphorusRunoff,
    directN2O,
    indirectN2O,
    totalCarbonEquivalent
  };
}
