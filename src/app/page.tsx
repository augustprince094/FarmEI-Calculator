"use client"

import { useState } from 'react';
import { FarmDataInput } from '@/components/calculator/FarmDataInput';
import { EmissionsResults } from '@/components/calculator/EmissionsResults';
import { MitigationAI } from '@/components/calculator/MitigationAI';
import { calculateEmissions, FarmData, ComparativeResults, EmissionResults, AnimalType } from '@/lib/calculations';
import { Leaf, Info, BookOpen, ShieldCheck, ArrowRight, RefreshCw, Layers, Calculator, TrendingDown, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const [scenarioFcr, setScenarioFcr] = useState<number>(0);

  const handleEstablishBaseline = (data: FarmData) => {
    const results = calculateEmissions(data, false);
    setBaselineData(data);
    setBaselineResults(results);
    setScenarioFcr(data.fcr);
    setStep('results');
    setComparisonResults(null);
    setSelectedAdditive('none');
  };

  const handleApplyMitigation = (additive: FarmData['additive']) => {
    if (!baselineData || !baselineResults) return;
    
    setSelectedAdditive(additive);
    
    let targetFcr = scenarioFcr;
    if (additive !== 'none' && targetFcr === baselineData.fcr) {
      const reduction = (additive === 'jefo-combo' || additive === 'xylanase') ? 0.94 : (additive === 'jefo-pro' ? 0.97 : 0.95);
      targetFcr = parseFloat((baselineData.fcr * reduction).toFixed(2));
      setScenarioFcr(targetFcr);
    } else if (additive === 'none') {
      targetFcr = baselineData.fcr;
      setScenarioFcr(targetFcr);
    }

    const updatedData = { ...baselineData, additive, fcr: targetFcr };
    const scenarioResults = calculateEmissions(updatedData, true);
    
    setComparisonResults({
      baseline: baselineResults,
      scenario: scenarioResults,
      additiveType: additive
    });
  };

  const handleFcrChange = (newFcr: number) => {
    setScenarioFcr(newFcr);
    if (!baselineData || !baselineResults || selectedAdditive === 'none') return;

    const updatedData = { ...baselineData, additive: selectedAdditive, fcr: newFcr };
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

  const isPhased = baselineData?.animalType === 'broilers' || 
                   baselineData?.animalType === 'swine-nursery' ||
                   baselineData?.animalType === 'swine-sow';

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
              <p className="text-white/70 text-[11px] uppercase tracking-wider font-bold">Comparative Assessment</p>
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
                <div className="space-y-6 text-sm leading-relaxed pr-2">
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Nutrient Excretion (Mass Balance)</h4>
                    <p className="font-bold">Calculated as dietary intake minus biological retention. Xylanase supplementation models a 4.5% improvement in N digestibility based on peer-reviewed data.</p>
                    <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-2 font-black text-slate-700">
                      <p><strong>N Intake</strong> = {"Sum((Feed_i * CP_i / 100) / 6.25)"}</p>
                      <p><strong>N Retention</strong> = {"Sum((Weight_Gain_i * 29g N/kg) * Count)"}</p>
                      <p className="border-t border-white/30 pt-2 mt-2"><strong>P Intake</strong> = {"Sum(Feed_i * P_i / 100)"}</p>
                      <p><strong>P Retention</strong> = {"Sum((Weight_Gain_i * 0.006) * Count)"}</p>
                    </div>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Nitrous Oxide (IPCC 2019)</h4>
                    <p className="font-bold text-xs italic">For Broilers: Emissions factor is applied (1.0) only for 'Poultry with litter' systems. All other systems use factor 0.</p>
                    <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-4 font-black text-slate-700">
                      <div>
                        <p className="text-xs uppercase text-primary mb-1 font-black">Direct N2O</p>
                        <p>{"Direct N2O = N_excreted * AWMS_Factor * EF * (44/28)"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-primary mb-1 font-black">Indirect N2O</p>
                        <p>{"Indirect N2O = N_excreted * AWMS_Factor * FracGas * 0.01 (EF4) * (44/28)"}</p>
                      </div>
                    </div>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Methane (CH4) Balance</h4>
                    <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-4 font-black text-slate-700">
                      <div>
                        <p className="text-xs uppercase text-primary mb-1 font-black">Enteric Methane (IPCC Tier 2)</p>
                        <p><strong>Poultry:</strong> {"1.6g CH4 / bird / cycle"}</p>
                        <p><strong>Swine:</strong> {"(Weight * Multiplier / 365) * Headcount * CycleDays"}</p>
                      </div>
                      <div className="border-t border-white/30 pt-2">
                        <p className="text-xs uppercase text-primary mb-1 font-black">Manure Methane (VS Balance)</p>
                        <p className="mb-2">{"CH4 (kg) = VS * B0 * MCF * 0.67"}</p>
                        <p className="text-[11px] text-muted-foreground font-bold">{"VS (Volatile Solids) = Feed Intake * (1 - 85% DMD) * (1 - 10% Ash)"}</p>
                        <p className="text-[11px] text-muted-foreground font-bold italic">{"B0: Swine NA (0.48), Swine EU (0.45), Poultry (0.36)"}</p>
                        <p className="text-[11px] text-muted-foreground font-bold italic">{"MCF: Lagoon (67%), Slurry/Pit (16%), Litter/Solid (2%)"}</p>
                      </div>
                    </div>
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
                Establish your production baseline by defining core efficiency metrics.
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
                  {baselineData?.region && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Region</span>
                      <span className="text-primary">{baselineData.region}</span>
                    </div>
                  )}
                  {baselineData?.animalType === 'broilers' && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">AWMS</span>
                      <span className="text-primary">{baselineData.awms ? awmsLabels[baselineData.awms] : ''}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Baseline FCR</span>
                    <span className="text-secondary">{baselineData?.fcr}</span>
                  </div>
                  
                  {isPhased && baselineData && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                      <div className="text-[11px] font-black uppercase text-primary/60 border-b border-primary/10 pb-2 tracking-widest">
                        {baselineData.animalType === 'swine-sow' ? 'Sow Nutrition (Gest/Lact)' : 'Dietary Strategy'}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {baselineData.animalType === 'swine-sow' ? (
                          <>
                            <span className="text-muted-foreground font-bold">CP %</span>
                            <span className="text-right text-primary font-black">{baselineData.phase1CP}/{baselineData.phase2CP}</span>
                            <span className="text-muted-foreground font-bold">P %</span>
                            <span className="text-right text-primary font-black">{baselineData.phase1P}/{baselineData.phase2P}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground font-bold">CP % (P1-3)</span>
                            <span className="text-right text-primary font-black">{baselineData.phase1CP}/{baselineData.phase2CP}/{baselineData.phase3CP}</span>
                            <span className="text-muted-foreground font-bold">P % (P1-3)</span>
                            <span className="text-right text-primary font-black">{baselineData.phase1P}/{baselineData.phase2P}/{baselineData.phase3P}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">Exit Weight</span>
                    <span className="text-primary font-black">{baselineData?.avgWeight} kg</span>
                  </div>
                </div>
              </div>

              <div className="glass-dark p-6 rounded-2xl bg-primary/10 border-white/20">
                <h3 className="font-black text-primary mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <ArrowRight className="w-5 h-5" /> Strategies
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
                  <div className="space-y-3 p-4 bg-white/50 rounded-xl border border-white/50 animate-in zoom-in-95 duration-200 backdrop-blur-xl">
                    <Label className="text-[11px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                      <Calculator className="w-4 h-4" /> Improved FCR
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={scenarioFcr}
                      onChange={(e) => handleFcrChange(parseFloat(e.target.value) || 0)}
                      className="h-11 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-base"
                    />
                  </div>
                )}
              </div>

              {baselineData && (comparisonResults?.scenario || baselineResults) && (
                <MitigationAI 
                  data={baselineData} 
                  results={comparisonResults?.scenario || baselineResults!} 
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
                      scenarioFcr={scenarioFcr}
                    />
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-0">
                    <div className="glass p-8 rounded-2xl border-white/40">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-black text-primary uppercase tracking-widest">Technical Audit</h3>
                          <p className="text-sm font-bold text-muted-foreground mt-1">Detailed mass balance & emission factor audit.</p>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-black py-2 px-4 bg-primary/10 border-primary/30 text-primary uppercase tracking-[0.2em]">Validated Engine</Badge>
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
                              { label: 'Nitrogen Excreted', unit: 'kg N', key: 'nitrogenExcreted', precision: 1 },
                              { label: 'Phosphorus Excreted', unit: 'kg P', key: 'phosphorusExcreted', precision: 1 },
                              { label: 'Enteric Methane', unit: 'kg CH4', key: 'entericMethane', precision: 3 },
                              { label: 'Manure Methane', unit: 'kg CH4', key: 'manureMethane', precision: 3 },
                              { label: 'Direct N2O', unit: 'kg N2O', key: 'directN2O', precision: 3 },
                              { label: 'Indirect N2O', unit: 'kg N2O', key: 'indirectN2O', precision: 3 },
                              { label: 'Phosphorus Runoff', unit: 'kg P', key: 'phosphorusRunoff', precision: 2 },
                              { label: 'Carbon Equiv.', unit: 'kg CO2e', key: 'totalCarbonEquivalent', precision: 0 },
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

      <footer className="bg-white/40 backdrop-blur-md border-t border-white/30 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Leaf className="w-5 h-5 text-primary opacity-70" />
            <span className="font-black text-xl text-primary tracking-tight uppercase">FarmEI Estimator</span>
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.3em] font-black">
            © {new Date().getFullYear()} FarmEI • Precision Environmental Metrics • Feed additive metabolic model applied
          </div>
        </div>
      </footer>
    </div>
  );
}