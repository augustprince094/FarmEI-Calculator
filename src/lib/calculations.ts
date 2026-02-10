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
 * Calculates farm emissions based on mass balance and IPCC Tier 1 defaults.
 * 
 * Nitrogen Formulas used (as per user requirement):
 * - Feed Intake (per animal) = FCR * Market Weight
 * - Nitrogen Intake = (Feed Intake * Crude Protein %) / 100 / 6.25
 * - Nitrogen Retention = (29 g/kg * Market Weight) / 1000
 * - Nitrogen Excreted = Nitrogen Intake - Nitrogen Retention
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { count, fcr, cyclesPerYear, feedCrudeProtein, feedPhosphorus, animalType, manureManagement, avgWeight, additive } = data;
  
  // Total yearly feed consumption calculation
  const totalAnimalsYearly = count * cyclesPerYear;
  const feedPerAnimal = fcr * avgWeight;
  const totalFeedPerYear = totalAnimalsYearly * feedPerAnimal;

  // Additive logic: Mitigation impacts on nutrient excretion
  let nMitigationFactor = 1.0;
  let pMitigationFactor = 1.0;
  let ch4MitigationFactor = 1.0;

  if (useAdditive && additive !== 'none') {
    if (additive === 'jefo-pro') {
      nMitigationFactor = 0.91; // 9% reduction in excretion
      pMitigationFactor = 0.95; // 5% reduction
      ch4MitigationFactor = 0.95; // 5% reduction
    } else if (additive === 'poa-eo') {
      nMitigationFactor = 0.86; // 14% reduction in excretion
      pMitigationFactor = 0.92; // 8% reduction
      ch4MitigationFactor = 0.88; // 12% reduction
    }
  }

  // --- NITROGEN MASS BALANCE ---
  // Nitrogen Intake (kg/yr) = (Feed * (CP/100)) / 6.25
  const nitrogenIntakeYearly = (totalFeedPerYear * (feedCrudeProtein / 100)) / 6.25;
  
  // Nitrogen Retention (kg/yr) = (29 g/kg * avgWeight / 1000) * count * cycles
  // Based on the constant 29g N per kg of body weight
  const nitrogenRetentionPerAnimal = (29 * avgWeight) / 1000;
  const totalNitrogenRetentionYearly = nitrogenRetentionPerAnimal * totalAnimalsYearly;
  
  // Nitrogen Excreted = Intake - Retention (applied with mitigation factor)
  const baseNitrogenExcreted = Math.max(0, nitrogenIntakeYearly - totalNitrogenRetentionYearly);
  const totalNitrogenExcreted = baseNitrogenExcreted * nMitigationFactor;

  // --- PHOSPHORUS MASS BALANCE ---
  // Keeping standard retention factors for Phosphorus unless specified
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const totalPhosphorusIntake = totalFeedPerYear * (feedPhosphorus / 100);
  const totalPhosphorusExcreted = totalPhosphorusIntake * (1 - pRetentionFactor) * pMitigationFactor;

  // --- METHANE CALCULATIONS ---
  // Enteric Methane: Poultry is 0, Swine heuristic based on weight
  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * 0.03);
  const totalEntericMethane = entericEmissionFactor * totalAnimalsYearly * ch4MitigationFactor;

  // Manure Methane (MCF factors)
  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  // VS (Volatile Solids) estimation
  const daysInCycle = animalType === 'broilers' ? 42 : 160;
  const totalDaysOccupied = cyclesPerYear * daysInCycle;
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  const manureMethane = vsPerDay * count * totalDaysOccupied * mcf * 0.6 * ch4MitigationFactor;

  // --- OTHER METRICS ---
  // Phosphorus Runoff (standard 5% leaching factor)
  const runoffFactor = 0.05;
  const totalPhosphorusRunoff = totalPhosphorusExcreted * runoffFactor;

  // N2O Calculations (IPCC Tier 1)
  const directN2oFactor = {
    'lagoon': 0.005,
    'solid': 0.02,
    'slurry': 0.005,
    'dry-lot': 0.01
  }[manureManagement] || 0.01;
  
  const directN2O = totalNitrogenExcreted * directN2oFactor * (44 / 28);
  const indirectN2O = totalNitrogenExcreted * 0.01 * (44 / 28);

  // Total CO2e (GWP100: CH4=28, N2O=265)
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
