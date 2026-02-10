
export type AnimalType = 'broilers' | 'swine';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year
  feedCrudeProtein: number; // percentage (e.g., 18)
  feedPhosphorus: number; // percentage (e.g., 0.6)
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
  const { count, fcr, cyclesPerYear, feedCrudeProtein, feedPhosphorus, animalType, manureManagement, avgWeight, additive } = data;
  
  // Total yearly feed consumption calculation based on provided FCR
  const totalAnimalsYearly = count * cyclesPerYear;
  const feedPerAnimal = fcr * avgWeight;
  const totalFeedPerYear = totalAnimalsYearly * feedPerAnimal;

  // Additive logic: Direct mitigation impacts on nutrient excretion efficiency
  // (In addition to FCR improvements which are now handled by the user input FCR)
  let metabolicNMitigation = 1.0;
  let metabolicPMitigation = 1.0;
  let ch4MitigationFactor = 1.0;

  if (useAdditive && additive !== 'none') {
    if (additive === 'jefo-pro') {
      // Jefo Pro improves protein/phosphorus utilization beyond just intake volume
      metabolicNMitigation = 0.95; 
      metabolicPMitigation = 0.98;
      ch4MitigationFactor = 0.95;
    } else if (additive === 'poa-eo') {
      metabolicNMitigation = 0.92;
      metabolicPMitigation = 0.95;
      ch4MitigationFactor = 0.88;
    }
  }

  // --- NITROGEN MASS BALANCE (User Provided Formulas) ---
  // Nitrogen Intake (kg/yr) = (Feed * (CP/100)) / 6.25
  const nitrogenIntakeYearly = (totalFeedPerYear * (feedCrudeProtein / 100)) / 6.25;
  
  // Nitrogen Retention (kg/yr) = (29 g/kg * avgWeight / 1000) * count * cycles
  const nitrogenRetentionPerAnimal = (29 * avgWeight) / 1000;
  const totalNitrogenRetentionYearly = nitrogenRetentionPerAnimal * totalAnimalsYearly;
  
  // Nitrogen Excreted = Intake - Retention (applied with metabolic efficiency factor if additive used)
  const baseNitrogenExcreted = Math.max(0, nitrogenIntakeYearly - totalNitrogenRetentionYearly);
  const totalNitrogenExcreted = baseNitrogenExcreted * metabolicNMitigation;

  // --- PHOSPHORUS MASS BALANCE ---
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const totalPhosphorusIntake = totalFeedPerYear * (feedPhosphorus / 100);
  const totalPhosphorusExcreted = totalPhosphorusIntake * (1 - pRetentionFactor) * metabolicPMitigation;

  // --- METHANE CALCULATIONS ---
  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * 0.03);
  const totalEntericMethane = entericEmissionFactor * totalAnimalsYearly * ch4MitigationFactor;

  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  // VS * Animals * Days is estimated. We'll use 365 days for annual estimation.
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
