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
  cyclesPerYear: number; 
  feedCrudeProtein: number; // percentage
  phase1CP?: number; 
  phase2CP?: number; 
  phase3CP?: number; 
  feedPhosphorus: number; // percentage
  phase1P?: number; 
  phase2P?: number; 
  phase3P?: number; 
  manureManagement: 'lagoon' | 'solid' | 'slurry' | 'dry-lot' | 'pit-long-term';
  avgWeight: number; // kg
  additive: FeedAdditive;
  nitrogenDigestibility: number; // Nitrogen/Protein Digestibility (0-1)
  // Experimental Data Fields
  useExperimentalData?: boolean;
  useExperimentalN?: boolean;
  useExperimentalP?: boolean;
  fecalN?: number; // Single input for cycle fecal nitrogen %
  fecalP?: number; // Single input for cycle fecal phosphorus %
  cycleDurationDays?: number;
  // Sow Specific Fields
  pigletsPerLitter?: number;
  avgLitterWeight?: number;
  gestationFeedIntake?: number;
  lactationFeedIntake?: number;
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
 * Calculates farm emissions per production cycle using hybrid Laboratory/Metabolic logic.
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
    fecalN, fecalP,
    cycleDurationDays,
    nitrogenDigestibility,
    gestationFeedIntake,
    lactationFeedIntake,
    avgLitterWeight,
    pigletsPerLitter
  } = data;
  
  // Total feed calculation logic
  let totalFeedPerCycle = count * fcr * avgWeight;
  if (animalType === 'swine-sow' && gestationFeedIntake && lactationFeedIntake) {
    totalFeedPerCycle = (gestationFeedIntake + lactationFeedIntake) * count;
  }
  
  const totalGain = animalType === 'swine-sow' 
    ? (avgLitterWeight || 15) * (pigletsPerLitter || 12) 
    : avgWeight;
  
  const nDigestibility = nitrogenDigestibility || 0.85;

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
  let totalVolatileSolids = 0;

  const cycleDays = cycleDurationDays || {
    'broilers': 42,
    'swine-sow': 365,
    'swine-nursery': 49,
    'swine-grow-finish': 115
  }[animalType] || 42;

  let phaseDist = { p1: 1, p2: 0, p3: 0 };
  if (animalType === 'broilers') phaseDist = { p1: 0.14, p2: 0.45, p3: 0.41 };
  else if (animalType === 'swine-nursery') phaseDist = { p1: 0.15, p2: 0.35, p3: 0.50 };
  else if (animalType === 'swine-sow') {
    if (gestationFeedIntake && lactationFeedIntake) {
      const totalSowFeed = gestationFeedIntake + lactationFeedIntake;
      phaseDist = { p1: gestationFeedIntake / totalSowFeed, p2: lactationFeedIntake / totalSowFeed, p3: 0 };
    } else {
      phaseDist = { p1: 0.70, p2: 0.30, p3: 0 };
    }
  }

  const nRetentionFactor = 29; 
  const pRetentionFactor = 6;  
  const ash = 0.10; 
  const dmd_methane = 0.85;

  const calculatePhaseExcretion = (phaseIdx: 1 | 2 | 3, fraction: number) => {
    if (fraction <= 0) return;
    
    const phaseFeed = totalFeedPerCycle * fraction;
    const phaseGain = totalGain * fraction;
    
    if (useExperimentalData && useExperimentalN) {
      const fecalDMOutput = (phaseFeed / count) * (1 - nDigestibility);
      totalNitrogenExcreted += (fecalN || 0) / 100 * fecalDMOutput * count;
    } else {
      const phaseCP = [phase1CP, phase2CP, phase3CP][phaseIdx - 1] ?? feedCrudeProtein;
      const nIntake = (phaseFeed * phaseCP / 100) / 6.25;
      
      let nRetention = 0;
      if (animalType === 'swine-sow') {
        // Sow formula: N Retention = (Gain (sow+litter) * 18.6% protein) / 6.25
        nRetention = (phaseGain * count * 0.186) / 6.25;
      } else {
        nRetention = (nRetentionFactor * phaseGain / 1000) * count;
      }
      totalNitrogenExcreted += Math.max(0, nIntake - nRetention);
    }

    if (useExperimentalData && useExperimentalP) {
      const fecalDMOutput = (phaseFeed / count) * (1 - 0.85); 
      totalPhosphorusExcreted += ((fecalP || 0) / 100) * fecalDMOutput * count;
    } else {
      const phaseP = [phase1P, phase2P, phase3P][phaseIdx - 1] ?? feedPhosphorus;
      const pIntake = phaseFeed * (phaseP / 100);
      const pRetention = (pRetentionFactor * phaseGain / 1000) * count;
      totalPhosphorusExcreted += Math.max(0, pIntake - pRetention);
    }

    totalVolatileSolids += phaseFeed * (1 - dmd_methane) * (1 - ash);
  };

  calculatePhaseExcretion(1, phaseDist.p1);
  calculatePhaseExcretion(2, phaseDist.p2);
  calculatePhaseExcretion(3, phaseDist.p3);

  totalNitrogenExcreted *= metabolicNMitigation;
  totalPhosphorusExcreted *= metabolicPMitigation;
  
  // Apply unit factor of 4 to nitrogen
  totalNitrogenExcreted *= 4;

  const density_ch4 = 0.67;
  let b0 = 0.36; 
  if (animalType.startsWith('swine')) {
    if (region === 'North America') b0 = 0.48;
    else if (region === 'Western Europe' || region === 'Eastern Europe') b0 = 0.45;
  }
  
  const currentAwms = (animalType === 'broilers') ? (awms || 'poultry-litter') : (manureManagement || 'solid');
  let mcf_val = 0.02; 
  if (currentAwms === 'lagoon') mcf_val = 0.67;
  else if (currentAwms === 'liquid-slurry' || currentAwms === 'pit-long-term' || currentAwms === 'slurry') mcf_val = 0.16;
  else mcf_val = 0.02;

  let totalEntericMethane = 0;
  if (animalType === 'broilers') {
    totalEntericMethane = (1.6 / 1000) * count * ch4MitigationFactor;
  } else {
    let entericMultiplier = 0.05; 
    if (animalType === 'swine-nursery') entericMultiplier = 0.015;
    if (animalType === 'swine-grow-finish') entericMultiplier = 0.03;
    const entericEF = (avgWeight * entericMultiplier / 365);
    totalEntericMethane = entericEF * count * cycleDays * ch4MitigationFactor;
  }

  const manureMethane = totalVolatileSolids * b0 * mcf_val * density_ch4 * ch4MitigationFactor;
  const totalPhosphorusRunoff = totalPhosphorusExcreted * 0.029;
  
  let directN2oFactor = 0.01;
  let fracGas = 0.1;
  const ef4 = 0.01;

  if (currentAwms === 'lagoon') { directN2oFactor = 0.005; fracGas = 0.4; }
  else if (currentAwms === 'liquid-slurry' || currentAwms === 'slurry') { directN2oFactor = 0.005; fracGas = 0.25; }
  else if (currentAwms === 'solid-storage' || currentAwms === 'solid') { directN2oFactor = 0.005; fracGas = 0.3; }
  else if (currentAwms === 'pit-long-term') { directN2oFactor = 0.01; fracGas = 0.45; }

  const directN2O = totalNitrogenExcreted * directN2oFactor * (44 / 28);
  const indirectN2O = totalNitrogenExcreted * fracGas * ef4 * (44 / 28);

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