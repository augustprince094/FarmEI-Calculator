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
 * EQUATIONS:
 * Nitrogen Excretion (Phase) = (Nitrogen Intake - Nitrogen Retention)
 * Phosphorus Excretion (Phase) = (Phosphorus Intake - Phosphorus Retention)
 * 
 * Partitioning:
 * - Broilers: 14/45/41 for Intake & Gain
 * - Swine Nursery: 15/35/50 for Intake & Gain
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

  // Additive metabolic efficiency factors
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
    } else if (additive === 'xylanase') {
      metabolicNMitigation = 0.98;
      metabolicPMitigation = 0.99;
      ch4MitigationFactor = 0.98;
    } else if (additive === 'jefo-combo') {
      metabolicNMitigation = 0.93;
      metabolicPMitigation = 0.96;
      ch4MitigationFactor = 0.93;
    }
  }

  let totalNitrogenExcreted = 0;
  let totalPhosphorusExcreted = 0;

  const isPhased = (animalType === 'broilers' || animalType === 'swine-nursery') && 
                   phase1CP !== undefined && phase2CP !== undefined && phase3CP !== undefined &&
                   phase1P !== undefined && phase2P !== undefined && phase3P !== undefined;

  if (isPhased) {
    const phaseDist = animalType === 'broilers' 
      ? { p1: 0.14, p2: 0.45, p3: 0.41 } 
      : { p1: 0.15, p2: 0.35, p3: 0.50 };

    const nRetentionFactor = 29; // g N / kg gain
    const pRetentionFactor = 6;  // g P / kg gain (0.6%)

    // Phase 1
    const p1Feed = totalFeedPerCycle * phaseDist.p1;
    const p1Gain = totalGain * phaseDist.p1;
    const p1NIntake = (p1Feed * phase1CP! / 100) / 6.25;
    const p1NRetention = (nRetentionFactor * p1Gain / 1000) * count;
    const p1PIntake = p1Feed * (phase1P! / 100);
    const p1PRetention = (pRetentionFactor * p1Gain / 1000) * count;
    totalNitrogenExcreted += Math.max(0, p1NIntake - p1NRetention);
    totalPhosphorusExcreted += Math.max(0, p1PIntake - p1PRetention);

    // Phase 2
    const p2Feed = totalFeedPerCycle * phaseDist.p2;
    const p2Gain = totalGain * phaseDist.p2;
    const p2NIntake = (p2Feed * phase2CP! / 100) / 6.25;
    const p2NRetention = (nRetentionFactor * p2Gain / 1000) * count;
    const p2PIntake = p2Feed * (phase2P! / 100);
    const p2PRetention = (pRetentionFactor * p2Gain / 1000) * count;
    totalNitrogenExcreted += Math.max(0, p2NIntake - p2NRetention);
    totalPhosphorusExcreted += Math.max(0, p2PIntake - p2PRetention);

    // Phase 3
    const p3Feed = totalFeedPerCycle * phaseDist.p3;
    const p3Gain = totalGain * phaseDist.p3;
    const p3NIntake = (p3Feed * phase3CP! / 100) / 6.25;
    const p3NRetention = (nRetentionFactor * p3Gain / 1000) * count;
    const p3PIntake = p3Feed * (phase3P! / 100);
    const p3PRetention = (pRetentionFactor * p3Gain / 1000) * count;
    totalNitrogenExcreted += Math.max(0, p3NIntake - p3NRetention);
    totalPhosphorusExcreted += Math.max(0, p3PIntake - p3PRetention);

  } else {
    // Single Phase Analysis
    const nIntake = (totalFeedPerCycle * (feedCrudeProtein / 100)) / 6.25;
    const nRetention = (29 * avgWeight / 1000) * count;
    const pIntake = totalFeedPerCycle * (feedPhosphorus / 100);
    const pRetention = (6 * avgWeight / 1000) * count;
    totalNitrogenExcreted = Math.max(0, nIntake - nRetention);
    totalPhosphorusExcreted = Math.max(0, pIntake - pRetention);
  }

  // Apply metabolic additive efficiency
  totalNitrogenExcreted *= metabolicNMitigation;
  totalPhosphorusExcreted *= metabolicPMitigation;

  // Gas Emissions
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

  // REFINED MANURE METHANE (User Request)
  // Manure methane = Volatile solids * Maximum methane * MCF * density
  // VS = feed intake * (1 - DMD) * (1 - A)
  const dmd = 0.85; // 85%
  const ash = 0.10; // 10%
  const b0 = 0.36;  // Maximum methane potential
  const mcf_val = 0.015; // 1.5%
  const density_ch4 = 0.0662; // kg/m3 as requested

  const totalVolatileSolids = totalFeedPerCycle * (1 - dmd) * (1 - ash);
  const manureMethane = totalVolatileSolids * b0 * mcf_val * density_ch4 * ch4MitigationFactor;

  const totalPhosphorusRunoff = totalPhosphorusExcreted * 0.05;

  // Direct and Indirect N2O logic update (IPCC 2019)
  let directN2oFactor = 0.01;
  let fracGas = 0.1;
  const ef4 = 0.01;
  const awmsFactor = 1.0;

  if (animalType === 'broilers') {
    directN2oFactor = 0.001; // IPCC 2019 for poultry litter
    fracGas = 0.2;           // Frac_gas for poultry litter
  } else {
    directN2oFactor = {
      'lagoon': 0.005,
      'solid': 0.02,
      'slurry': 0.005,
      'dry-lot': 0.01
    }[manureManagement] || 0.01;
    fracGas = {
      'lagoon': 0.4,
      'solid': 0.45,
      'slurry': 0.25,
      'dry-lot': 0.3
    }[manureManagement] || 0.2;
  }
  
  const directN2O = totalNitrogenExcreted * awmsFactor * directN2oFactor * (44 / 28);
  const indirectN2O = totalNitrogenExcreted * awmsFactor * fracGas * ef4 * (44 / 28);

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
