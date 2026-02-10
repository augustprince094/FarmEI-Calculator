export type AnimalType = 'broilers' | 'swine';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year
  feedCrudeProtein: number; // percentage
  feedPhosphorus: number; // percentage
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

export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { count, fcr, cyclesPerYear, feedCrudeProtein, feedPhosphorus, animalType, manureManagement, avgWeight, additive } = data;
  
  // Total yearly feed consumption based on FCR:
  // Feed = Gain * FCR. Assuming gain is roughly target market weight for simplicity.
  const totalFeedPerYear = count * cyclesPerYear * avgWeight * fcr;

  // Additive logic: Heuristic impacts based on research for Jefo Pro and P(OA+EO)
  let nMitigationFactor = 1.0;
  let pMitigationFactor = 1.0;
  let ch4MitigationFactor = 1.0;

  if (useAdditive && additive !== 'none') {
    if (additive === 'jefo-pro') {
      nMitigationFactor = 0.91; // 9% reduction
      pMitigationFactor = 0.95; // 5% reduction
      ch4MitigationFactor = 0.95; // 5% reduction
    } else if (additive === 'poa-eo') {
      nMitigationFactor = 0.86; // 14% reduction
      pMitigationFactor = 0.92; // 8% reduction
      ch4MitigationFactor = 0.88; // 12% reduction
    }
  }

  // Mass Balance - Nitrogen
  // Nitrogen Intake (kg/yr) = Feed * (CP/100) / 6.25
  const totalNitrogenIntake = (totalFeedPerYear * (feedCrudeProtein / 100)) / 6.25;
  const nRetentionFactor = animalType === 'broilers' ? 0.45 : 0.32;
  const totalNitrogenExcreted = totalNitrogenIntake * (1 - nRetentionFactor) * nMitigationFactor;

  // Mass Balance - Phosphorus
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const totalPhosphorusIntake = totalFeedPerYear * (feedPhosphorus / 100);
  const totalPhosphorusExcreted = totalPhosphorusIntake * (1 - pRetentionFactor) * pMitigationFactor;

  // Enteric Methane
  // Poultry usually 0, Swine based on weight
  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * 0.03);
  const totalEntericMethane = entericEmissionFactor * count * cyclesPerYear * ch4MitigationFactor;

  // Manure Methane
  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  // VS (Volatile Solids) estimation
  const daysInCycle = animalType === 'broilers' ? 42 : 160; // Approximations
  const totalDaysOccupied = cyclesPerYear * daysInCycle;
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  const manureMethane = vsPerDay * count * totalDaysOccupied * mcf * 0.6 * ch4MitigationFactor;

  // Phosphorus Runoff
  const runoffFactor = 0.05;
  const totalPhosphorusRunoff = totalPhosphorusExcreted * runoffFactor;

  // N2O Calculations
  const directN2oFactor = {
    'lagoon': 0.005,
    'solid': 0.02,
    'slurry': 0.005,
    'dry-lot': 0.01
  }[manureManagement] || 0.01;
  const directN2O = totalNitrogenExcreted * directN2oFactor * (44 / 28);
  const indirectN2O = totalNitrogenExcreted * 0.01 * (44 / 28);

  // Total CO2e
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