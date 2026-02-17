export type AnimalType = 'broilers' | 'swine-sow' | 'swine-nursery' | 'swine-grow-finish';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year
  feedCrudeProtein: number; // percentage (used for swine or as fallback)
  broilerCPStarter?: number; // Broiler specific phase 1 (14% of feed)
  broilerCPGrower?: number;  // Broiler specific phase 2 (45% of feed)
  broilerCPFinisher?: number; // Broiler specific phase 3 (41% of feed)
  feedPhosphorus: number; // percentage (used for swine or as fallback)
  broilerPStarter?: number; // Broiler specific phase 1 (14% of feed)
  broilerPGrower?: number;  // Broiler specific phase 2 (45% of feed)
  broilerPFinisher?: number; // Broiler specific phase 3 (41% of feed)
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
 * NITROGEN EQUATIONS (Per Cycle):
 * 1. Intake = Σ (Phase Feed Intake * Phase CP%) / 6.25
 * 2. Retention = (29g/kg * Final Weight) / 1000 * Count
 * 3. Excretion = Intake - Retention
 * 
 * PHASE DISTRIBUTION (Broilers):
 * Starter: 14%, Grower: 45%, Finisher: 41%
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { 
    count, fcr, 
    broilerCPStarter, broilerCPGrower, broilerCPFinisher,
    broilerPStarter, broilerPGrower, broilerPFinisher,
    feedCrudeProtein, feedPhosphorus,
    animalType, manureManagement, avgWeight, additive 
  } = data;
  
  // Total feed consumption per cycle (kg Feed)
  const totalFeedPerCycle = count * fcr * avgWeight;

  // Additive logic: Direct mitigation impacts on nutrient excretion efficiency
  let metabolicNMitigation = 1.0;
  let metabolicPMitigation = 1.0;
  let ch4MitigationFactor = 1.0;

  if (useAdditive && additive !== 'none') {
    if (additive === 'jefo-pro') {
      metabolicNMitigation = 0.95; 
      metabolicPMitigation = 0.98;
      ch4MitigationFactor = 0.95;
    } else if (additive === 'poa-eo') {
      metabolicNMitigation = 0.92;
      metabolicPMitigation = 0.95;
      ch4MitigationFactor = 0.88;
    }
  }

  let totalNitrogenIntake = 0;
  let totalPhosphorusIntake = 0;

  if (animalType === 'broilers' && 
      broilerCPStarter !== undefined && broilerCPGrower !== undefined && broilerCPFinisher !== undefined &&
      broilerPStarter !== undefined && broilerPGrower !== undefined && broilerPFinisher !== undefined) {
    
    // Phase distributions
    const pStarter = 0.14;
    const pGrower = 0.45;
    const pFinisher = 0.41;

    // Phase feed amounts
    const starterFeed = totalFeedPerCycle * pStarter;
    const growerFeed = totalFeedPerCycle * pGrower;
    const finisherFeed = totalFeedPerCycle * pFinisher;

    // Phase Nitrogen Intake = (Feed * CP% / 100) / 6.25
    const starterNIntake = (starterFeed * broilerCPStarter / 100) / 6.25;
    const growerNIntake = (growerFeed * broilerCPGrower / 100) / 6.25;
    const finisherNIntake = (finisherFeed * broilerCPFinisher / 100) / 6.25;
    totalNitrogenIntake = starterNIntake + growerNIntake + finisherNIntake;

    // Phase Phosphorus Intake = Feed * P% / 100
    const starterPIntake = starterFeed * (broilerPStarter / 100);
    const growerPIntake = growerFeed * (broilerPGrower / 100);
    const finisherPIntake = finisherFeed * (broilerPFinisher / 100);
    totalPhosphorusIntake = starterPIntake + growerPIntake + finisherPIntake;

  } else {
    // Single phase fallback (Swine)
    totalNitrogenIntake = (totalFeedPerCycle * (feedCrudeProtein / 100)) / 6.25;
    totalPhosphorusIntake = totalFeedPerCycle * (feedPhosphorus / 100);
  }

  // --- NITROGEN RETENTION ---
  // Constant 29g N per kg body weight gain (assume gain = final weight for simplicity of batch)
  const totalNitrogenRetention = (29 * avgWeight / 1000) * count;
  
  // Nitrogen Excretion = Intake - Retention
  const baseNitrogenExcreted = Math.max(0, totalNitrogenIntake - totalNitrogenRetention);
  const totalNitrogenExcreted = baseNitrogenExcreted * metabolicNMitigation;

  // --- PHOSPHORUS RETENTION ---
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const totalPhosphorusRetention = totalPhosphorusIntake * pRetentionFactor;
  const totalPhosphorusExcreted = (totalPhosphorusIntake - totalPhosphorusRetention) * metabolicPMitigation;

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
  const totalEntericMethane = entericEmissionFactor * count * cycleDays * ch4MitigationFactor;

  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
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
