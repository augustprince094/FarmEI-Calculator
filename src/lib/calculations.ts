
export type AnimalType = 'broilers' | 'swine';

export interface FarmData {
  animalType: AnimalType;
  count: number;
  feedConsumption: number; // kg per animal per day
  feedCrudeProtein: number; // percentage
  feedPhosphorus: number; // percentage
  manureManagement: 'lagoon' | 'solid' | 'slurry' | 'dry-lot';
  avgWeight: number; // kg
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

export function calculateEmissions(data: FarmData): EmissionResults {
  const { count, feedConsumption, feedCrudeProtein, feedPhosphorus, animalType, manureManagement, avgWeight } = data;
  const daysInYear = 365;

  // Mass Balance - Nitrogen
  // Nitrogen Intake = Feed consumption * protein content / 6.25
  const nitrogenIntakePerDay = (feedConsumption * (feedCrudeProtein / 100)) / 6.25;
  
  // Nitrogen Retention (standard values)
  // Broilers retain approx 40-50%, Swine approx 30-35%
  const nRetentionFactor = animalType === 'broilers' ? 0.45 : 0.32;
  const nitrogenExcretedPerDay = nitrogenIntakePerDay * (1 - nRetentionFactor);
  const totalNitrogenExcreted = nitrogenExcretedPerDay * count * daysInYear;

  // Mass Balance - Phosphorus
  // Phosphorus Retention (standard values)
  const pRetentionFactor = animalType === 'broilers' ? 0.35 : 0.25;
  const phosphorusIntakePerDay = feedConsumption * (feedPhosphorus / 100);
  const phosphorusExcretedPerDay = phosphorusIntakePerDay * (1 - pRetentionFactor);
  const totalPhosphorusExcreted = phosphorusExcretedPerDay * count * daysInYear;

  // Enteric Methane
  // Broilers have negligible enteric methane. Swine have specific emission factors.
  const entericEmissionFactor = animalType === 'broilers' ? 0 : (avgWeight * 0.03); // Rough IPCC Tier 1 estimate
  const totalEntericMethane = entericEmissionFactor * count;

  // Manure Methane
  // Depends on volatile solids and manure management conversion factors
  const mcf = {
    'lagoon': 0.7,
    'solid': 0.04,
    'slurry': 0.35,
    'dry-lot': 0.015
  }[manureManagement] || 0.1;
  
  // Estimation of Volatile Solids (VS) based on weight
  const vsPerDay = animalType === 'broilers' ? (avgWeight * 0.01) : (avgWeight * 0.005);
  const manureMethane = vsPerDay * count * daysInYear * mcf * 0.6; // 0.6 is rough Bo factor

  // Phosphorus Runoff (standard leaching rate)
  const runoffFactor = 0.05; // 5% loss rate estimate
  const totalPhosphorusRunoff = totalPhosphorusExcreted * runoffFactor;

  // N2O Calculations (Direct and Indirect)
  // Direct N2O: based on N excreted and manure management system
  const directN2oFactor = {
    'lagoon': 0.005,
    'solid': 0.02,
    'slurry': 0.005,
    'dry-lot': 0.01
  }[manureManagement] || 0.01;
  const directN2O = totalNitrogenExcreted * directN2oFactor * (44 / 28); // Convert N to N2O

  // Indirect N2O: from leaching and volatilization
  const indirectN2O = totalNitrogenExcreted * 0.01 * (44 / 28); // Rough global default

  // Total CO2e
  // Methane GWP = 28, N2O GWP = 265
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
