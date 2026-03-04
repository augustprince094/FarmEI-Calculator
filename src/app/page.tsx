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

  const isPhased = baselineData?.animalType === 'broilers' || baselineData?.animalType === 'swine-nursery';

  const calculateDiff = (base: number, scen: number) => {
    if (base === 0) return 0;
    return ((scen - base) / base) * 100;
  };

  const formatDiff = (diff: number) => {
    if (Math.abs(diff) < 0.1) return <span className="text-muted-foreground text-[10px] font-medium">0%</span>;
    const isReduction = diff < 0;
    return (
      <span className={cn("flex items-center gap-1 font-bold text-[10px]", isReduction ? "text-green-600" : "text-red-600")}>
        {isReduction ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
        {Math.abs(diff).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary/90 backdrop-blur-md sticky top-0 z-50 py-2.5 border-b border-white/10">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 backdrop-blur-lg rounded-lg border border-white/30">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">FarmEI Estimator</h1>
              <p className="text-white/70 text-[8px] uppercase tracking-wider font-bold">Comparative Assessment</p>
            </div>
          </div>
          <nav className="flex gap-5 text-white/90 font-medium text-[11px]">
            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-white transition-colors flex items-center gap-1"><Info className="w-3 h-3" /> Science</button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass">
                <DialogHeader>
                  <DialogTitle>Environmental Intensity Methodology</DialogTitle>
                </DialogHeader>
                <div className="space-y-3.5 text-xs leading-relaxed pr-2">
                  <section>
                    <h4 className="font-bold text-primary mb-1">Nutrient Excretion (Mass Balance):</h4>
                    <p className="mb-1 text-[11px]">Calculated per phase as the difference between dietary intake and biological retention.</p>
                    <div className="bg-white/40 backdrop-blur-md p-2.5 rounded-lg border border-white/20 space-y-1 text-[11px]">
                      <p><strong>N Intake</strong> = {"Sum((Feed_i * CP_i / 100) / 6.25)"}</p>
                      <p><strong>N Retention</strong> = {"Sum((Weight_Gain_i * 29g N/kg) * Count)"}</p>
                      <p className="border-t border-white/30 pt-1 mt-1"><strong>P Intake</strong> = {"Sum(Feed_i * P_i / 100)"}</p>
                      <p><strong>P Retention</strong> = {"Sum((Weight_Gain_i * 0.006) * Count)"}</p>
                    </div>
                  </section>
                  <section>
                    <h4 className="font-bold text-primary mb-1">Nitrous Oxide (IPCC 2019):</h4>
                    <div className="bg-white/40 backdrop-blur-md p-2.5 rounded-lg border border-white/20 space-y-2 text-[11px]">
                      <div>
                        <p className="font-bold text-[10px] uppercase text-primary">Poultry (Broilers)</p>
                        <p><strong>Direct N2O</strong> = {"$N_{exc} \\times 1.0 (AWMS) \\times 0.001 (EF) \\times (44/28)$"}</p>
                        <p><strong>Indirect N2O</strong> = {"$N_{exc} \\times 1.0 (AWMS) \\times 0.2 (Frac_{gas}) \\times 0.01 (EF_4) \\times (44/28)$"}</p>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="font-bold text-primary mb-1">Methane (CH4):</h4>
                    <div className="bg-white/40 backdrop-blur-md p-2.5 rounded-lg border border-white/20 space-y-2 text-[11px]">
                      <div>
                        <p className="font-bold text-[10px] uppercase text-primary">Enteric Methane (Poultry)</p>
                        <p><strong>Enteric CH4</strong> = {"1.6g / bird / cycle"}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[10px] uppercase text-secondary">Manure Methane (VS Balance)</p>
                        <p><strong>Manure CH4</strong> = {"$VS \\times B_0 \\times MCF \\times Density$"}</p>
                        <div className="text-[9px] text-muted-foreground italic grid grid-cols-2 gap-1 mt-1">
                          <span>{"$VS = Feed_{in} \\times (1 - DMD) \\times (1 - Ash)$"}</span>
                          <span>DMD: 85%, Ash: 10%</span>
                          <span>{"$B_0$: 0.36 $m^3/kg$"}</span>
                          <span>MCF: 1.5%</span>
                          <span>Density: 0.0662</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </DialogContent>
            </Dialog>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><BookOpen className="w-3 h-3" /> Additives</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Methodology</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        {step === 'input' ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary mb-1">Environmental Footprint Baseline</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-[13px]">
                Establish your production baseline by defining core efficiency metrics.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <FarmDataInput onCalculate={handleEstablishBaseline} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 space-y-4">
              <div className="glass p-4 rounded-2xl border-white/30">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-[11px] uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" /> Cycle Baseline
                  </h3>
                  <Button variant="outline" size="sm" onClick={reset} className="text-[9px] h-6 bg-white/20 border-white/30 px-2">
                    <RefreshCw className="w-2.5 h-2.5 mr-1" /> Edit
                  </Button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-bold">{baselineData ? animalTypeLabels[baselineData.animalType] : ''}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-muted-foreground">Baseline FCR:</span>
                    <span className="font-bold text-secondary">{baselineData?.fcr}</span>
                  </div>
                  
                  {isPhased && baselineData && (
                    <div className="p-2.5 bg-primary/5 rounded-xl border border-primary/10 space-y-1.5">
                      <div className="text-[8px] font-bold uppercase text-primary/60 border-b border-primary/10 pb-0.5 tracking-wider">Dietary Phases</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                        <span className="text-muted-foreground">CP Strategy:</span>
                        <span className="font-bold text-right">{baselineData.phase1CP}/{baselineData.phase2CP}/{baselineData.phase3CP}%</span>
                        
                        <span className="text-muted-foreground">P Strategy:</span>
                        <span className="font-bold text-right">{baselineData.phase1P}/{baselineData.phase2P}/{baselineData.phase3P}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-muted-foreground">Exit Weight:</span>
                    <span className="font-bold">{baselineData?.avgWeight} kg</span>
                  </div>
                </div>
              </div>

              <div className="glass-dark p-4 rounded-2xl bg-primary/10 border-white/20">
                <h3 className="font-bold text-primary mb-2.5 flex items-center gap-2 text-[11px] uppercase tracking-wider">
                  <ArrowRight className="w-3.5 h-3.5" /> Mitigation Strategy
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { id: 'jefo-pro', label: 'Jefo Pro', color: '#FBBC01' },
                    { id: 'poa-eo', label: 'P(OA+EO)', color: '#D38F89' },
                    { id: 'xylanase', label: 'Xylanase', color: '#4A90E2' },
                    { id: 'jefo-combo', label: 'Xyl + Pro', color: '#F5A623' },
                  ].map((item) => (
                    <Button 
                      key={item.id}
                      variant={selectedAdditive === item.id ? 'default' : 'outline'}
                      onClick={() => handleApplyMitigation(item.id as any)}
                      className={cn(
                        "h-8 px-2 border-white/10 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider",
                        selectedAdditive === item.id ? "ring-2 ring-primary ring-offset-1" : "hover:bg-white/30"
                      )}
                      style={selectedAdditive === item.id ? { backgroundColor: item.color } : {}}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>

                {selectedAdditive !== 'none' && (
                  <div className="space-y-1.5 p-2.5 bg-white/40 rounded-xl border border-white/40 animate-in zoom-in-95 duration-200 backdrop-blur-md">
                    <Label className="text-[9px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest">
                      <Calculator className="w-2.5 h-2.5" /> Improved Cycle FCR
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={scenarioFcr}
                      onChange={(e) => handleFcrChange(parseFloat(e.target.value) || 0)}
                      className="h-8 border-white/50 focus:ring-primary font-bold text-secondary bg-white/50 text-xs"
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
                  <TabsList className="grid w-full grid-cols-2 mb-4 h-10 p-1 bg-white/40 backdrop-blur-xl border border-white/30 rounded-xl shadow-sm">
                    <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[10px] font-bold uppercase tracking-wider">
                      {comparisonResults ? 'Comparative Summary' : 'Baseline Results'}
                    </TabsTrigger>
                    <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[10px] font-bold uppercase tracking-wider">
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
                    <div className="glass p-5 rounded-2xl border-white/30">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Technical Audit</h3>
                          <p className="text-[10px] text-muted-foreground">Mass balance and gas emission audit breakdown.</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-bold py-0.5 px-2 bg-primary/5 border-primary/20 text-primary uppercase tracking-widest">Mass Balance Engine</Badge>
                      </div>
                      
                      <div className="overflow-hidden border border-white/20 rounded-xl bg-white/5 backdrop-blur-md">
                        <Table>
                          <TableHeader className="bg-primary/5 backdrop-blur-lg">
                            <TableRow className="hover:bg-transparent border-white/20 h-10">
                              <TableHead className="w-[180px] font-bold text-primary text-[10px] uppercase tracking-wider">Metric</TableHead>
                              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider border-x border-white/10 px-4">Base</TableHead>
                              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider bg-primary/5 px-4">Scen</TableHead>
                              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider bg-white/20 px-4">Δ %</TableHead>
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
                                <TableRow key={item.key} className="hover:bg-white/10 transition-colors border-white/10 h-10">
                                  <TableCell className="py-1">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-primary/80 text-[10px]">{item.label}</span>
                                      <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-bold">{item.unit}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-muted-foreground text-[10px] border-x border-white/10 px-4">{baseVal.toFixed(item.precision)}</TableCell>
                                  <TableCell className="text-right font-mono font-bold text-primary text-[10px] bg-primary/5 px-4">{scenVal.toFixed(item.precision)}</TableCell>
                                  <TableCell className="text-right bg-white/10 px-4">{formatDiff(diff)}</TableCell>
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

      <footer className="bg-white/40 backdrop-blur-md border-t border-white/30 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Leaf className="w-3.5 h-3.5 text-primary opacity-60" />
            <span className="font-bold text-sm text-primary tracking-tight">FarmEI Estimator</span>
          </div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
            © {new Date().getFullYear()} FarmEI • Precision Environmental Metrics
          </div>
        </div>
      </footer>
    </div>
  );
}
