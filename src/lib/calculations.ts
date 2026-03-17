export type AnimalType = 'broilers' | 'swine-sow' | 'swine-nursery' | 'swine-grow-finish';
export type FeedAdditive = 'none' | 'jefo-pro' | 'poa-eo' | 'xylanase' | 'jefo-combo';
export type Region = 'Western Europe' | 'Eastern Europe' | 'Asia' | 'Africa' | 'North America' | 'Latin America';
export type AWMS = 'lagoon' | 'liquid-slurry' | 'poultry-litter' | 'solid-storage' | 'pit-long-term';

export interface FarmData {
  animalType: AnimalType;
  region?: Region;
  awms?: AWMS;
  count: number;
  fcr: number; // Feed Conversion Ratio
  cyclesPerYear: number; // Number of production cycles per year
  feedCrudeProtein: number; // percentage
  phase1CP?: number; // Phase 1 CP (%) / Gestation CP for Sow
  phase2CP?: number; // Phase 2 CP (%) / Lactation CP for Sow
  phase3CP?: number; // Phase 3 CP (%)
  feedPhosphorus: number; // percentage
  phase1P?: number; // Phase 1 P (%) / Gestation P for Sow
  phase2P?: number; // Phase 2 P (%) / Lactation P for Sow
  phase3P?: number; // Phase 3 P (%)
  manureManagement: 'lagoon' | 'solid' | 'slurry' | 'dry-lot';
  avgWeight: number; // kg
  additive: FeedAdditive;
  // Experimental Data Fields
  useExperimentalData?: boolean;
  useExperimentalN?: boolean;
  useExperimentalP?: boolean;
  phase1FecalN?: number;
  phase2FecalN?: number;
  phase3FecalN?: number;
  phase1FecalP?: number;
  phase2FecalP?: number;
  phase3FecalP?: number;
  cycleDurationDays?: number;
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
 * Calculates farm emissions per production cycle.
 * Supports standard mass-balance and experimental fecal-measurement methods.
 */
export function calculateEmissions(data: FarmData, useAdditive: boolean = false): EmissionResults {
  const { 
    count, fcr, 
    phase1CP, phase2CP, phase3CP,
    phase1P, phase2P, phase3P,
    feedCrudeProtein, feedPhosphorus,
    animalType, manureManagement, avgWeight, additive,
    awms, region,
    useExperimentalData, useExperimentalN, useExperimentalP,
    phase1FecalN, phase2FecalN, phase3FecalN,
    phase1FecalP, phase2FecalP, phase3FecalP,
    cycleDurationDays
  } = data;
  
  const totalFeedPerCycle = count * fcr * avgWeight;
  const totalGain = avgWeight;
  const dmd = 0.85; // Dry Matter Digestibility

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
      metabolicNMitigation = 0.955; 
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
  let totalFeedIntakeAccumulated = 0;

  const cycleDays = cycleDurationDays || {
    'broilers': 42,
    'swine-sow': 365,
    'swine-nursery': 49,
    'swine-grow-finish': 115
  }[animalType] || 42;

  const isPhased = (animalType === 'broilers' || animalType === 'swine-nursery' || animalType === 'swine-sow');

  let phaseDist = { p1: 1, p2: 0, p3: 0 };
  if (animalType === 'broilers') phaseDist = { p1: 0.14, p2: 0.45, p3: 0.41 };
  else if (animalType === 'swine-nursery') phaseDist = { p1: 0.15, p2: 0.35, p3: 0.50 };
  else if (animalType === 'swine-sow') phaseDist = { p1: 0.70, p2: 0.30, p3: 0 };

  const nRetentionFactor = 29; // g N / kg gain
  const pRetentionFactor = 6;  // g P / kg gain

  const calculatePhaseExcretion = (phaseIdx: 1 | 2 | 3, fraction: number) => {
    if (fraction <= 0) return;
    
    const phaseFeed = totalFeedPerCycle * fraction;
    const phaseGain = totalGain * fraction;
    
    // Nitrogen calculation for phase
    if (useExperimentalData && useExperimentalN) {
      const phaseFecalN = [phase1FecalN, phase2FecalN, phase3FecalN][phaseIdx - 1] || 0;
      const fecalDMOutput = phaseFeed * (1 - dmd);
      totalNitrogenExcreted += (phaseFecalN / 100) * fecalDMOutput;
    } else {
      const phaseCP = [phase1CP, phase2CP, phase3CP][phaseIdx - 1] ?? feedCrudeProtein;
      const nIntake = (phaseFeed * phaseCP / 100) / 6.25;
      const nRetention = (nRetentionFactor * phaseGain / 1000) * count;
      totalNitrogenExcreted += Math.max(0, nIntake - nRetention);
    }

    // Phosphorus calculation for phase
    if (useExperimentalData && useExperimentalP) {
      const phaseFecalP = [phase1FecalP, phase2FecalP, phase3FecalP][phaseIdx - 1] || 0;
      const fecalDMOutput = phaseFeed * (1 - dmd);
      totalPhosphorusExcreted += (phaseFecalP / 100) * fecalDMOutput;
    } else {
      const phaseP = [phase1P, phase2P, phase3P][phaseIdx - 1] ?? feedPhosphorus;
      const pIntake = phaseFeed * (phaseP / 100);
      const pRetention = (pRetentionFactor * phaseGain / 1000) * count;
      totalPhosphorusExcreted += Math.max(0, pIntake - pRetention);
    }

    totalFeedIntakeAccumulated += phaseFeed;
  };

  calculatePhaseExcretion(1, phaseDist.p1);
  calculatePhaseExcretion(2, phaseDist.p2);
  calculatePhaseExcretion(3, phaseDist.p3);

  totalNitrogenExcreted *= metabolicNMitigation;
  totalPhosphorusExcreted *= metabolicPMitigation;

  // Enteric Methane
  let totalEntericMethane = 0;
  if (animalType === 'broilers') {
    totalEntericMethane = (1.6 / 1000) * count * ch4MitigationFactor;
  } else {
    let entericMultiplier = 0.05; // Default for Sow
    if (animalType === 'swine-nursery') entericMultiplier = 0.015;
    if (animalType === 'swine-grow-finish') entericMultiplier = 0.03;
    const entericEmissionFactor = (avgWeight * entericMultiplier / 365);
    totalEntericMethane = entericEmissionFactor * count * cycleDays * ch4MitigationFactor;
  }

  // Manure Methane (VS Balance)
  const ash = 0.10; 
  const density_ch4 = 0.67; // kg/m3 (IPCC 2019 Standard)
  
  let b0 = 0.36; 
  if (animalType.startsWith('swine')) {
    if (region === 'North America') b0 = 0.48;
    else if (region === 'Western Europe' || region === 'Eastern Europe') b0 = 0.45;
    else b0 = 0.45; 
  }
  
  let mcf_val = 0.02; 
  if (animalType === 'broilers') {
    if (awms === 'lagoon') mcf_val = 0.67;
    else if (awms === 'liquid-slurry') mcf_val = 0.16;
    else if (awms === 'solid-storage') mcf_val = 0.02;
    else if (awms === 'pit-long-term') mcf_val = 0.16;
    else mcf_val = 0.02; 
  } else {
    if (manureManagement === 'lagoon') mcf_val = 0.67;
    else if (manureManagement === 'slurry') mcf_val = 0.16;
    else if (manureManagement === 'solid') mcf_val = 0.02;
    else if (manureManagement === 'dry-lot') mcf_val = 0.02;
  }

  const totalVolatileSolids = totalFeedIntakeAccumulated * (1 - dmd) * (1 - ash);
  const manureMethane = totalVolatileSolids * b0 * mcf_val * density_ch4 * ch4MitigationFactor;

  // Phosphorus run-off
  const totalPhosphorusRunoff = totalPhosphorusExcreted * 0.029;

  // Direct and Indirect N2O
  let directN2oFactor = 0.01;
  let fracGas = 0.1;
  const ef4 = 0.01;
  let awmsFactor = 1.0;

  if (animalType === 'broilers') {
    if (awms !== 'poultry-litter') {
      awmsFactor = 0;
    }
    if (awms === 'lagoon') { directN2oFactor = 0.005; fracGas = 0.4; }
    else if (awms === 'liquid-slurry') { directN2oFactor = 0.005; fracGas = 0.25; }
    else if (awms === 'solid-storage') { directN2oFactor = 0.005; fracGas = 0.3; }
    else if (awms === 'pit-long-term') { directN2oFactor = 0.01; fracGas = 0.45; }
    else { directN2oFactor = 0.001; fracGas = 0.2; }
  } else {
    directN2oFactor = { 'lagoon': 0.005, 'solid': 0.02, 'slurry': 0.005, 'dry-lot': 0.01 }[manureManagement] || 0.01;
    fracGas = { 'lagoon': 0.4, 'solid': 0.45, 'slurry': 0.25, 'dry-lot': 0.3 }[manureManagement] || 0.2;
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
