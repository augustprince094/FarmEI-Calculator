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
  feedPhosphorus: number;
  manureManagement: 'lagoon' | 'solid' | 'slurry' | 'dry-lot';
  avgWeight: number; // kg (target market weight)
  additive: FeedAdditive;
}

export interface EmissionResults {
  nitrogenExcreted: number; // kg/year
  phosphorusExcreted: number; // kg/year
  entericMethane: number; // kg CH4/year
  manureMethane: number; // kg CH4/year
  phosphorusRunoff: number; // kg/year
  directN2O: number; // kg N2O/year
  indirectN2O: number; // kg N2O/year
  totalCarbonEquivalent: number; // kg CO2e/year
}

export interface ComparativeResults {
  baseline: EmissionResults;
  scenario: EmissionResults;
  additiveType: FeedAdditive;
}

/**
 * Calculates farm emissions based on mass balance and user-provided nitrogen formulas.
 * 
 * Nitrogen Formulas:
 * - Feed Intake (per animal) = FCR * Market Weight
 * - Nitrogen Intake = (Feed Intake * Crude Protein %) / 100 / 6.25
 * - Nitrogen Retention = (29 g/kg * Market Weight) / 1000
 * - Nitrogen Excreted = Nitrogen Intake - Nitrogen Retention
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { count, fcr, cyclesPerYear, feedCrudeProtein, broilerCPStarter, broilerCPGrower, broilerCPFinisher, feedPhosphorus, animalType, manureManagement, avgWeight, additive } = data;
  
  // Total yearly feed consumption calculation based on provided FCR
  const totalAnimalsYearly = count * cyclesPerYear;
  const feedPerAnimal = fcr * avgWeight;
  const totalFeedPerYear = totalAnimalsYearly * feedPerAnimal;

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

  // --- NITROGEN MASS BALANCE (User Provided Formulas) ---
  const nitrogenIntakeYearly = (totalFeedPerYear * (effectiveCP / 100)) / 6.25;
  const nitrogenRetentionPerAnimal = (29 * avgWeight) / 1000;
  const totalNitrogenRetentionYearly = nitrogenRetentionPerAnimal * totalAnimalsYearly;
  
  const baseNitrogenExcreted = Math.max(0, nitrogenIntakeYearly - totalNitrogenRetentionYearly);
  const totalNitrogenExcreted = baseNitrogenExcreted * metabolicNMitigation;

  // --- PHOSPHORUS MASS BALANCE ---
  const isSwine = animalType.startsWith('swine');
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const totalPhosphorusIntake = totalFeedPerYear * (feedPhosphorus / 100);
  const totalPhosphorusExcreted = totalPhosphorusIntake * (1 - pRetentionFactor) * metabolicPMitigation;

  // --- METHANE CALCULATIONS ---
  // Sows have higher enteric factors due to body size and residence time
  let entericMultiplier = 0.03;
  if (animalType === 'swine-sow') entericMultiplier = 0.05;
  if (animalType === 'swine-nursery') entericMultiplier = 0.015;

  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * entericMultiplier);
  const totalEntericMethane = entericEmissionFactor * totalAnimalsYearly * ch4MitigationFactor;

  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  const manureMethane = vsPerDay * count * 365 * mcf * 0.6 * ch4MitigationFactor;

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