"use client"

import { useState } from 'react';
import { FarmDataInput } from '@/components/calculator/FarmDataInput';
import { EmissionsResults } from '@/components/calculator/EmissionsResults';
import { MitigationAI } from '@/components/calculator/MitigationAI';
import { calculateEmissions, FarmData, ComparativeResults, EmissionResults, AnimalType } from '@/lib/calculations';
import { Leaf, Info, BookOpen, ShieldCheck, ArrowRight, RefreshCw, Layers, Calculator, TrendingDown, TrendingUp, FlaskConical, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const animalTypeLabels: Record<AnimalType, string> = {
  'broilers': 'Broilers',
  'swine-sow': 'Swine (Sow & Litter)',
  'swine-nursery': 'Swine (Nursery)',
  'swine-grow-finish': 'Swine (Grow-to-Finish)'
};

const awmsLabels: Record<string, string> = {
  'lagoon': 'Lagoon',
  'liquid-slurry': 'Liquid/Slurry',
  'poultry-litter': 'Poultry with litter',
  'solid-storage': 'Solid storage',
  'pit-long-term': 'Pit > 1 month'
};

export default function Home() {
  const [baselineData, setBaselineData] = useState<FarmData | null>(null);
  const [baselineResults, setBaselineResults] = useState<EmissionResults | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparativeResults | null>(null);
  const [step, setStep] = useState<'input' | 'results'>('input');
  
  const [selectedAdditive, setSelectedAdditive] = useState<FarmData['additive']>('none');
  const [scenarioFcr, setScenarioFcr] = useState<string>('');
  const [scenarioFecalN, setScenarioFecalN] = useState<string>('');
  const [scenarioFecalP, setScenarioFecalP] = useState<string>('');
  const [scenarioNitrogenDigestibility, setScenarioNitrogenDigestibility] = useState<string>('');

  const handleEstablishBaseline = (data: FarmData) => {
    const results = calculateEmissions(data, false);
    setBaselineData(data);
    setBaselineResults(results);
    setScenarioFcr('');
    setScenarioFecalN('');
    setScenarioFecalP('');
    setScenarioNitrogenDigestibility('');
    setStep('results');
    setComparisonResults(null);
    setSelectedAdditive('none');
  };

  const handleApplyMitigation = (additive: FarmData['additive']) => {
    if (!baselineData || !baselineResults) return;
    
    setSelectedAdditive(additive);
    
    let targetFcrValue = Number(scenarioFcr) || baselineData.fcr;
    if (additive !== 'none' && !scenarioFcr) {
      const reduction = (additive === 'jefo-combo' || additive === 'xylanase') ? 0.94 : (additive === 'jefo-pro' ? 0.97 : 0.95);
      targetFcrValue = parseFloat((baselineData.fcr * reduction).toFixed(2));
    }

    let targetFecalNValue = Number(scenarioFecalN) || (baselineData.fecalN || 0);
    let targetFecalPValue = Number(scenarioFecalP) || (baselineData.fecalP || 0);
    let targetNDigValue = Number(scenarioNitrogenDigestibility) || baselineData.nitrogenDigestibility;
    
    if (additive !== 'none') {
      if (baselineData.useExperimentalN && !scenarioFecalN) {
        targetFecalNValue = parseFloat(((baselineData.fecalN || 0) * 0.97).toFixed(2));
      }
      if (baselineData.useExperimentalP && !scenarioFecalP) {
        targetFecalPValue = parseFloat(((baselineData.fecalP || 0) * 0.98).toFixed(2));
      }
      if (!scenarioNitrogenDigestibility) {
        targetNDigValue = Math.min(0.99, parseFloat((baselineData.nitrogenDigestibility * 1.05).toFixed(2)));
      }
    }

    const updatedData = { 
      ...baselineData, 
      additive, 
      fcr: targetFcrValue,
      fecalN: targetFecalNValue,
      fecalP: targetFecalPValue,
      nitrogenDigestibility: targetNDigValue
    };
    const scenarioResults = calculateEmissions(updatedData, true);
    
    setComparisonResults({
      baseline: baselineResults,
      scenario: scenarioResults,
      additiveType: additive
    });
  };

  const handleScenarioMetricChange = (field: 'fcr' | 'fecalN' | 'fecalP' | 'nDig', value: string) => {
    if (!baselineData || !baselineResults) return;

    if (field === 'fcr') setScenarioFcr(value);
    else if (field === 'fecalN') setScenarioFecalN(value);
    else if (field === 'fecalP') setScenarioFecalP(value);
    else if (field === 'nDig') setScenarioNitrogenDigestibility(value);

    const updatedFcr = field === 'fcr' ? (Number(value) || baselineData.fcr) : (Number(scenarioFcr) || baselineData.fcr);
    const updatedFecalN = field === 'fecalN' ? (Number(value) || (baselineData.fecalN || 0)) : (Number(scenarioFecalN) || (baselineData.fecalN || 0));
    const updatedFecalP = field === 'fecalP' ? (Number(value) || (baselineData.fecalP || 0)) : (Number(scenarioFecalP) || (baselineData.fecalP || 0));
    const updatedNDig = field === 'nDig' ? (Number(value) || baselineData.nitrogenDigestibility) : (Number(scenarioNitrogenDigestibility) || baselineData.nitrogenDigestibility);

    const updatedData = { 
      ...baselineData, 
      additive: selectedAdditive, 
      fcr: updatedFcr,
      fecalN: updatedFecalN,
      fecalP: updatedFecalP,
      nitrogenDigestibility: updatedNDig
    };
    const scenarioResults = calculateEmissions(updatedData, true);
    
    setComparisonResults({
      baseline: baselineResults,
      scenario: scenarioResults,
      additiveType: selectedAdditive
    });
  };

  const reset = () => {
    setBaselineData(null);
    setBaselineResults(null);
    setComparisonResults(null);
    setSelectedAdditive('none');
    setStep('input');
  };

  const calculateDiff = (base: number, scen: number) => {
    if (base === 0) return 0;
    return ((scen - base) / base) * 100;
  };

  const formatDiff = (diff: number) => {
    if (Math.abs(diff) < 0.1) return <span className="text-muted-foreground text-sm font-bold">0%</span>;
    const isReduction = diff < 0;
    return (
      <span className={cn("flex items-center gap-1 font-black text-sm", isReduction ? "text-green-600" : "text-red-600")}>
        {isReduction ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        {Math.abs(diff).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary/90 backdrop-blur-md sticky top-0 z-50 py-4 border-b border-white/10">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 backdrop-blur-lg rounded-lg border border-white/30">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FarmEI Estimator</h1>
              <p className="text-white/70 text-[11px] uppercase tracking-wider font-bold">Nutrient & Emission Audit</p>
            </div>
          </div>
          <nav className="flex gap-8 text-white/90 font-medium text-sm">
            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-white transition-colors flex items-center gap-2 font-bold"><Info className="w-5 h-5" /> Science</button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-primary uppercase">Environmental Methodology</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-sm leading-relaxed pr-2 font-bold">
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Nitrogen Excretion (Hybrid Mode)</h4>
                    <p>Calculated per phase (Phase 1-3 for broilers, Gestation/Lactation for sows):</p>
                    <ul className="list-disc pl-5 text-slate-700 space-y-1">
                      <li><strong>Metabolic path:</strong> (Dietary CP / 6.25) - (g N Retention * g Gain)</li>
                      <li><strong>Experimental path:</strong> Feed Intake * (1 - N Digestibility) * % Fecal N</li>
                    </ul>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Ammonia Emissions</h4>
                    <p>NH3 (kg) = 0.7 * Total Nitrogen Excreted * 0.89 * (42/365)</p>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Manure Methane</h4>
                    <p>CH4 (kg) = VS * B0 * MCF * 0.67</p>
                    <ul className="list-disc pl-5 text-slate-700 space-y-1">
                      <li>VS (Volatile Solids) = Feed Intake * (1 - 0.85 DMD) * (1 - 10% Ash)</li>
                      <li>B0 (Max Methane Capacity): 0.36 standard (0.48 N. America Swine).</li>
                      <li>MCF (Conversion Factor): Lagoon 67%, Liquid/Slurry/Pit 16%, Solid/Litter 2%.</li>
                    </ul>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Net GHG Emissions</h4>
                    <p>Includes enteric methane, manure methane, and direct/indirect N2O pathways, converted to CO2 equivalents.</p>
                  </section>
                </div>
              </DialogContent>
            </Dialog>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2 font-bold"><BookOpen className="w-5 h-5" /> Additives</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2 font-bold"><ShieldCheck className="w-5 h-5" /> Audit</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {step === 'input' ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-primary mb-3 uppercase tracking-tight">Cycle Baseline</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg font-bold">
                Establish your production baseline by defining core efficiency, dietary metrics, or laboratory results.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <FarmDataInput onCalculate={handleEstablishBaseline} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 space-y-8">
              <div className="glass p-6 rounded-2xl border-white/30">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-primary flex items-center gap-2 text-xs uppercase tracking-widest">
                    <Layers className="w-5 h-5" /> Parameters
                  </h3>
                  <Button variant="outline" size="sm" onClick={reset} className="text-xs h-9 bg-white/20 border-white/30 px-4 font-black uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4 mr-2" /> Reset
                  </Button>
                </div>
                <div className="space-y-4 text-sm font-black">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Category</span>
                    <span className="text-primary">{baselineData ? animalTypeLabels[baselineData.animalType] : ''}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Analysis Mode</span>
                    <span className="text-secondary">{baselineData?.useExperimentalData ? 'Laboratory' : 'Metabolic'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Baseline FCR</span>
                    <span className="text-primary">{baselineData?.fcr}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">AWMS</span>
                    <span className="text-primary">{baselineData?.awms ? awmsLabels[baselineData.awms] : (baselineData?.manureManagement ? awmsLabels[baselineData.manureManagement] : 'Default')}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Exit Weight</span>
                    <span className="text-primary font-black">{baselineData?.avgWeight} kg</span>
                  </div>
                </div>
              </div>

              <div className="glass-dark p-6 rounded-2xl bg-primary/10 border-white/20">
                <h3 className="font-black text-primary mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <ArrowRight className="w-5 h-5" /> Mitigation Strategies
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { id: 'jefo-pro', label: 'Jefo Pro', color: '#FBBC01' },
                    { id: 'poa-eo', label: 'P(OA+EO)', color: '#D38F89' },
                    { id: 'xylanase', label: 'Xylanase', color: '#F26648' },
                    { id: 'jefo-combo', label: 'Xyl + Pro', color: '#FCD84B' },
                  ].map((item) => (
                    <Button 
                      key={item.id}
                      variant={selectedAdditive === item.id ? 'default' : 'outline'}
                      onClick={() => handleApplyMitigation(item.id as any)}
                      className={cn(
                        "h-12 px-4 border-white/20 backdrop-blur-sm text-[11px] font-black uppercase tracking-widest",
                        selectedAdditive === item.id ? "ring-2 ring-primary ring-offset-2 text-slate-900" : "hover:bg-white/40"
                      )}
                      style={selectedAdditive === item.id ? { backgroundColor: item.color } : {}}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>

                {selectedAdditive !== 'none' && (
                  <div className="space-y-4 p-4 bg-white/50 rounded-xl border border-white/50 animate-in zoom-in-95 duration-200 backdrop-blur-xl">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                        <Calculator className="w-4 h-4" /> Improved FCR
                      </Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={scenarioFcr}
                        placeholder={"eg. " + ((baselineData?.fcr || 1.6) * 0.95).toFixed(2)}
                        onChange={(e) => handleScenarioMetricChange('fcr', e.target.value)}
                        className="h-10 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-sm placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                        <Zap className="w-4 h-4" /> Scenario N Digestibility
                      </Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={scenarioNitrogenDigestibility}
                        placeholder="eg. 0.90"
                        onChange={(e) => handleScenarioMetricChange('nDig', e.target.value)}
                        className="h-10 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-sm placeholder:text-muted-foreground/50"
                      />
                    </div>

                    {baselineData?.useExperimentalN && (
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                          <FlaskConical className="w-4 h-4" /> Scenario % Fecal N
                        </Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={scenarioFecalN}
                          placeholder={"eg. " + ((baselineData?.fecalN || 4.5) * 0.97).toFixed(2)}
                          onChange={(e) => handleScenarioMetricChange('fecalN', e.target.value)}
                          className="h-10 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {baselineData && baselineResults && (
                <MitigationAI 
                  data={baselineData} 
                  results={comparisonResults?.scenario || baselineResults} 
                />
              )}
            </div>

            <div className="lg:col-span-8">
              {baselineResults && (
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-14 p-2 bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm">
                    <TabsTrigger value="results" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-[11px] font-black uppercase tracking-widest">
                      Comparison
                    </TabsTrigger>
                    <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-[11px] font-black uppercase tracking-widest">
                      Technical Audit
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="results" className="mt-0">
                    <EmissionsResults 
                      results={comparisonResults || { baseline: baselineResults, scenario: baselineResults, additiveType: 'none' }} 
                      isComparison={!!comparisonResults}
                      baselineFcr={baselineData?.fcr || 0}
                      scenarioFcr={Number(scenarioFcr) || baselineData?.fcr || 0}
                    />
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-0">
                    <div className="glass p-8 rounded-2xl border-white/40">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-black text-primary uppercase tracking-widest">Technical Audit</h3>
                          <p className="text-sm font-bold text-muted-foreground mt-1">Detailed nutrient balance & emission intensities.</p>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-black py-2 px-4 bg-primary/10 border-primary/30 text-primary uppercase tracking-[0.2em]">Tier 2 Engine (v4.3)</Badge>
                      </div>
                      
                      <div className="overflow-hidden border border-white/30 rounded-2xl bg-white/10 backdrop-blur-lg">
                        <Table>
                          <TableHeader className="bg-primary/10 backdrop-blur-xl">
                            <TableRow className="hover:bg-transparent border-white/20 h-14">
                              <TableHead className="w-[240px] font-black text-primary text-[11px] uppercase tracking-widest">Metric</TableHead>
                              <TableHead className="text-right font-black text-[11px] uppercase tracking-widest border-x border-white/10 px-8">Base</TableHead>
                              <TableHead className="text-right font-black text-[11px] uppercase tracking-widest bg-primary/5 px-8">Scen</TableHead>
                              <TableHead className="text-right font-black text-[11px] uppercase tracking-widest bg-white/20 px-8">Δ %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { label: 'Total Nitrogen Excreted', unit: 'kg N', key: 'nitrogenExcreted', precision: 1 },
                              { label: 'Total Ammonia Emissions', unit: 'kg NH3', key: 'ammoniaEmissions', precision: 2 },
                              { label: 'Enteric Methane', unit: 'kg CH4', key: 'entericMethane', precision: 3 },
                              { label: 'Manure Methane', unit: 'kg CH4', key: 'manureMethane', precision: 3 },
                              { label: 'Phosphorus Runoff', unit: 'kg P', key: 'phosphorusRunoff', precision: 3 },
                              { label: 'Direct N2O', unit: 'kg N2O', key: 'directN2O', precision: 3 },
                              { label: 'Indirect N2O', unit: 'kg N2O', key: 'indirectN2O', precision: 3 },
                              { label: 'Net GHG Emissions', unit: 'kg CO2e', key: 'netGhgEmissions', precision: 0 },
                            ].map((item) => {
                              const baseVal = baselineResults[item.key as keyof EmissionResults];
                              const scenVal = (comparisonResults?.scenario || baselineResults)[item.key as keyof EmissionResults];
                              const diff = calculateDiff(baseVal, scenVal);
                              
                              return (
                                <TableRow key={item.key} className="hover:bg-white/20 transition-colors border-white/10 h-14">
                                  <TableCell className="py-3 px-6">
                                    <div className="flex flex-col">
                                      <span className="font-black text-primary text-base">{item.label}</span>
                                      <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-black">{item.unit}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-black text-slate-600 text-base border-x border-white/10 px-8">{baseVal.toFixed(item.precision)}</TableCell>
                                  <TableCell className="text-right font-black text-primary text-base bg-primary/5 px-8">{scenVal.toFixed(item.precision)}</TableCell>
                                  <TableCell className="text-right bg-white/20 px-8">{formatDiff(diff)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
