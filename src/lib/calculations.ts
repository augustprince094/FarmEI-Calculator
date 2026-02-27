export type AnimalType = 'broilers' | 'swine-sow' | 'swine-nursery' | 'swine-grow-finish';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo' | 'xylanase' | 'jefo-combo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year
  feedCrudeProtein: number; // percentage (used for swine-sow/grow-finish or as fallback)
  phase1CP?: number; // Phase 1 CP (%)
  phase2CP?: number; // Phase 2 CP (%)
  phase3CP?: number; // Phase 3 CP (%)
  feedPhosphorus: number; // percentage (used for swine-sow/grow-finish or as fallback)
  phase1P?: number; // Phase 1 P (%)
  phase2P?: number; // Phase 2 P (%)
  phase3P?: number; // Phase 3 P (%)
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
 * PHASING LOGIC (14/45/41 Distribution):
 * - Broilers & Nursery Pigs use 3 phases for both Feed Intake and Weight Gain.
 * - Nitrogen retention constant: 29g N / kg weight gain.
 * - Phosphorus retention constant: 6g P / kg weight gain (0.6% tissue/bone content).
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { 
    count, fcr, 
    phase1CP, phase2CP, phase3CP,
    phase1P, phase2P, phase3P,
    feedCrudeProtein, feedPhosphorus,
    animalType, manureManagement, avgWeight, additive 
  } = data;
  
  const totalFeedPerCycle = count * fcr * avgWeight;
  const totalGain = avgWeight;

  let metabolicNMitigation = 1.0;
  let metabolicPMitigation = 1.0;
  let ch4MitigationFactor = 1.0;

  if (useAdditive && additive !== 'none') {
    if (additive === 'jefo-pro') {
      metabolicNMitigation = 0.95; // 5% improvement in N digestibility
      metabolicPMitigation = 0.98;
      ch4MitigationFactor = 0.95; 
    } else if (additive === 'poa-eo') {
      metabolicNMitigation = 0.92; // 8% improvement
      metabolicPMitigation = 0.95;
      ch4MitigationFactor = 0.88; // 12% CH4 reduction
    } else if (additive === 'xylanase') {
      metabolicNMitigation = 0.98; // 2% improvement
      metabolicPMitigation = 0.99;
      ch4MitigationFactor = 0.98;
    } else if (additive === 'jefo-combo') {
      metabolicNMitigation = 0.93; // 7% synergistic improvement
      metabolicPMitigation = 0.96;
      ch4MitigationFactor = 0.93;
    }
  }

  let totalNitrogenIntake = 0;
  let totalNitrogenRetention = 0;
  let totalPhosphorusIntake = 0;
  let totalPhosphorusRetention = 0;

  const isPhased = (animalType === 'broilers' || animalType === 'swine-nursery') && 
                   phase1CP !== undefined && phase2CP !== undefined && phase3CP !== undefined &&
                   phase1P !== undefined && phase2P !== undefined && phase3P !== undefined;

  if (isPhased) {
    const phaseDist = { p1: 0.14, p2: 0.45, p3: 0.41 }; // 14/45/41 Industry Standard

    const nRetentionFactor = 29; // g/kg (Standard N retention)
    const pRetentionFactor = 6; // g/kg (0.6% assumption for tissue/bones)

    // Phase 1
    const p1Feed = totalFeedPerCycle * phaseDist.p1;
    const p1Gain = totalGain * phaseDist.p1;
    totalNitrogenIntake += (p1Feed * phase1CP! / 100) / 6.25;
    totalNitrogenRetention += (nRetentionFactor * p1Gain / 1000) * count;
    totalPhosphorusIntake += p1Feed * (phase1P! / 100);
    totalPhosphorusRetention += (pRetentionFactor * p1Gain / 1000) * count;

    // Phase 2
    const p2Feed = totalFeedPerCycle * phaseDist.p2;
    const p2Gain = totalGain * phaseDist.p2;
    totalNitrogenIntake += (p2Feed * phase2CP! / 100) / 6.25;
    totalNitrogenRetention += (nRetentionFactor * p2Gain / 1000) * count;
    totalPhosphorusIntake += p2Feed * (phase2P! / 100);
    totalPhosphorusRetention += (pRetentionFactor * p2Gain / 1000) * count;

    // Phase 3
    const p3Feed = totalFeedPerCycle * phaseDist.p3;
    const p3Gain = totalGain * phaseDist.p3;
    totalNitrogenIntake += (p3Feed * phase3CP! / 100) / 6.25;
    totalNitrogenRetention += (nRetentionFactor * p3Gain / 1000) * count;
    totalPhosphorusIntake += p3Feed * (phase3P! / 100);
    totalPhosphorusRetention += (pRetentionFactor * p3Gain / 1000) * count;

  } else {
    totalNitrogenIntake = (totalFeedPerCycle * (feedCrudeProtein / 100)) / 6.25;
    totalNitrogenRetention = (29 * avgWeight / 1000) * count;
    
    totalPhosphorusIntake = totalFeedPerCycle * (feedPhosphorus / 100);
    const genericPRetentionFactor = 6; // g/kg
    totalPhosphorusRetention = (genericPRetentionFactor * avgWeight / 1000) * count;
  }

  const baseNitrogenExcreted = Math.max(0, totalNitrogenIntake - totalNitrogenRetention);
  const totalNitrogenExcreted = baseNitrogenExcreted * metabolicNMitigation;

  const basePhosphorusExcreted = Math.max(0, totalPhosphorusIntake - totalPhosphorusRetention);
  const totalPhosphorusExcreted = basePhosphorusExcreted * metabolicPMitigation;

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