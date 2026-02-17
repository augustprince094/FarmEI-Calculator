export type AnimalType = 'broilers' | 'swine-sow' | 'swine-nursery' | 'swine-grow-finish';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year (used for annual scaling in UI if needed)
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
 * Calculates farm emissions per production cycle based on mass balance.
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { 
    count, fcr, 
    broilerCPStarter, broilerCPGrower, broilerCPFinisher,
    broilerPStarter, broilerPGrower, broilerPFinisher,
    feedCrudeProtein, feedPhosphorus,
    animalType, manureManagement, avgWeight, additive 
  } = data;
  
  // Total feed consumption per cycle
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

  // Determine effective Crude Protein based on production type
  let effectiveCP = feedCrudeProtein;
  if (animalType === 'broilers' && broilerCPStarter !== undefined && broilerCPGrower !== undefined && broilerCPFinisher !== undefined) {
    // 14% starter, 45% grower, 41% finisher
    effectiveCP = (broilerCPStarter * 0.14) + (broilerCPGrower * 0.45) + (broilerCPFinisher * 0.41);
  }

  // Determine effective Phosphorus based on production type
  let effectiveP = feedPhosphorus;
  if (animalType === 'broilers' && broilerPStarter !== undefined && broilerPGrower !== undefined && broilerPFinisher !== undefined) {
    // 14% starter, 45% grower, 41% finisher
    effectiveP = (broilerPStarter * 0.14) + (broilerPGrower * 0.45) + (broilerPFinisher * 0.41);
  }

  // --- NITROGEN MASS BALANCE (Per Cycle) ---
  const nitrogenIntakeCycle = (totalFeedPerCycle * (effectiveCP / 100)) / 6.25;
  const nitrogenRetentionPerAnimal = (29 * avgWeight) / 1000;
  const totalNitrogenRetentionCycle = nitrogenRetentionPerAnimal * count;
  
  const baseNitrogenExcreted = Math.max(0, nitrogenIntakeCycle - totalNitrogenRetentionCycle);
  const totalNitrogenExcreted = baseNitrogenExcreted * metabolicNMitigation;

  // --- PHOSPHORUS MASS BALANCE (Per Cycle) ---
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const totalPhosphorusIntake = totalFeedPerCycle * (effectiveP / 100);
  const totalPhosphorusExcreted = totalPhosphorusIntake * (1 - pRetentionFactor) * metabolicPMitigation;

  // --- METHANE CALCULATIONS (Per Cycle) ---
  const cycleDays = {
    'broilers': 42,
    'swine-sow': 365, // Sows are usually calculated on annual basis, but we treat it as one cycle
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
