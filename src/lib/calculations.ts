export type AnimalType = 'broilers' | 'swine';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  feedConsumption: number; // kg per animal per day
  feedCrudeProtein: number; // percentage
  feedPhosphorus: number; // percentage
  manureManagement: 'lagoon' | 'solid' | 'slurry' | 'dry-lot';
  avgWeight: number; // kg
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
  const { count, feedConsumption, feedCrudeProtein, feedPhosphorus, animalType, manureManagement, avgWeight, additive } = data;
  const daysInYear = 365;

  // Additive logic: Heuristic impacts based on research for Jefo Pro and P(OA+EO)
  // Jefo Pro Solution: ~8-10% N reduction, ~5% P reduction
  // P(OA+EO): ~12-15% N reduction, ~8% P reduction, ~10% Methane reduction
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
  const nitrogenIntakePerDay = (feedConsumption * (feedCrudeProtein / 100)) / 6.25;
  const nRetentionFactor = animalType === 'broilers' ? 0.45 : 0.32;
  const nitrogenExcretedPerDay = nitrogenIntakePerDay * (1 - nRetentionFactor) * nMitigationFactor;
  const totalNitrogenExcreted = nitrogenExcretedPerDay * count * daysInYear;

  // Mass Balance - Phosphorus
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const phosphorusIntakePerDay = feedConsumption * (feedPhosphorus / 100);
  const phosphorusExcretedPerDay = phosphorusIntakePerDay * (1 - pRetentionFactor) * pMitigationFactor;
  const totalPhosphorusExcreted = phosphorusExcretedPerDay * count * daysInYear;

  // Enteric Methane
  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * 0.03);
  const totalEntericMethane = entericEmissionFactor * count * ch4MitigationFactor;

  // Manure Methane
  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  const manureMethane = vsPerDay * count * daysInYear * mcf * 0.6 * ch4MitigationFactor;

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
