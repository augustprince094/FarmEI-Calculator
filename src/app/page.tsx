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
  const [scenarioFcr, setScenarioFcr] = useState<number>(0);
  const [scenarioFecalN, setScenarioFecalN] = useState<number>(0);
  const [scenarioFecalP, setScenarioFecalP] = useState<number>(0);
  const [scenarioNitrogenDigestibility, setScenarioNitrogenDigestibility] = useState<number>(0.85);

  const handleEstablishBaseline = (data: FarmData) => {
    const results = calculateEmissions(data, false);
    setBaselineData(data);
    setBaselineResults(results);
    setScenarioFcr(data.fcr);
    setScenarioFecalN(data.fecalN || 0);
    setScenarioFecalP(data.fecalP || 0);
    setScenarioNitrogenDigestibility(data.nitrogenDigestibility || 0.85);
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

    let targetFecalN = scenarioFecalN;
    let targetFecalP = scenarioFecalP;
    let targetNDig = scenarioNitrogenDigestibility;
    
    if (additive !== 'none') {
      if (baselineData.useExperimentalN && targetFecalN === baselineData.fecalN) {
        targetFecalN = parseFloat(((baselineData.fecalN || 0) * 0.97).toFixed(2));
        setScenarioFecalN(targetFecalN);
      }
      if (baselineData.useExperimentalP && targetFecalP === baselineData.fecalP) {
        targetFecalP = parseFloat(((baselineData.fecalP || 0) * 0.98).toFixed(2));
        setScenarioFecalP(targetFecalP);
      }
      // Improved digestibility logic
      if (targetNDig === baselineData.nitrogenDigestibility) {
        targetNDig = Math.min(0.99, parseFloat((baselineData.nitrogenDigestibility * 1.05).toFixed(2)));
        setScenarioNitrogenDigestibility(targetNDig);
      }
    } else {
      targetFecalN = baselineData.fecalN || 0;
      targetFecalP = baselineData.fecalP || 0;
      targetNDig = baselineData.nitrogenDigestibility;
      setScenarioFecalN(targetFecalN);
      setScenarioFecalP(targetFecalP);
      setScenarioNitrogenDigestibility(targetNDig);
    }

    const updatedData = { 
      ...baselineData, 
      additive, 
      fcr: targetFcr,
      fecalN: targetFecalN,
      fecalP: targetFecalP,
      nitrogenDigestibility: targetNDig
    };
    const scenarioResults = calculateEmissions(updatedData, true);
    
    setComparisonResults({
      baseline: baselineResults,
      scenario: scenarioResults,
      additiveType: additive
    });
  };

  const handleScenarioMetricChange = (field: 'fcr' | 'fecalN' | 'fecalP' | 'nDig', value: number) => {
    if (!baselineData || !baselineResults) return;

    let updatedFcr = scenarioFcr;
    let updatedFecalN = scenarioFecalN;
    let updatedFecalP = scenarioFecalP;
    let updatedNDig = scenarioNitrogenDigestibility;

    if (field === 'fcr') {
      updatedFcr = value;
      setScenarioFcr(value);
    } else if (field === 'fecalN') {
      updatedFecalN = value;
      setScenarioFecalN(value);
    } else if (field === 'fecalP') {
      updatedFecalP = value;
      setScenarioFecalP(value);
    } else if (field === 'nDig') {
      updatedNDig = value;
      setScenarioNitrogenDigestibility(value);
    }

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
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Nitrogen Excretion (Experimental)</h4>
                    <p>When Laboratory Mode is active:</p>
                    <ul className="list-disc pl-5 text-slate-700 space-y-1">
                      <li>Daily Fecal DM Output = Feed Intake * (1 - Nitrogen Digestibility)</li>
                      <li>N Excretion = % Fecal N * Fecal DM Output</li>
                      <li>Total Nitrogen Excreted = Estimated N * 4</li>
                    </ul>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-black text-primary text-base uppercase tracking-widest">Methane (Manure)</h4>
                    <p>CH4 (kg) = VS * B0 * MCF * 0.67</p>
                    <p className="text-xs text-muted-foreground">VS (Volatile Solids) = Feed Intake * (1 - 0.85 DMD) * (1 - 10% Ash)</p>
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
                Establish your production baseline by defining core efficiency and digestibility metrics.
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
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">N Digestibility</span>
                    <span className="text-secondary">{baselineData?.nitrogenDigestibility}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-muted-foreground uppercase text-[11px] tracking-widest font-black">AWMS</span>
                    <span className="text-primary">{baselineData?.awms ? awmsLabels[baselineData.awms] : 'Default'}</span>
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
                        onChange={(e) => handleScenarioMetricChange('fcr', parseFloat(e.target.value) || 0)}
                        className="h-10 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-sm"
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
                        onChange={(e) => handleScenarioMetricChange('nDig', parseFloat(e.target.value) || 0)}
                        className="h-10 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-sm"
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
                          onChange={(e) => handleScenarioMetricChange('fecalN', parseFloat(e.target.value) || 0)}
                          className="h-10 border-white/60 focus:ring-primary font-black text-secondary bg-white/80 text-sm"
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
                      scenarioFcr={scenarioFcr}
                    />
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-0">
                    <div className="glass p-8 rounded-2xl border-white/40">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-black text-primary uppercase tracking-widest">Technical Audit</h3>
                          <p className="text-sm font-bold text-muted-foreground mt-1">Detailed nutrient balance & emission factors.</p>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-black py-2 px-4 bg-primary/10 border-primary/30 text-primary uppercase tracking-[0.2em]">Validated Factor Engine</Badge>
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
                              { label: 'Total Nitrogen Excreted', unit: 'kg N (Factor 4 applied)', key: 'nitrogenExcreted', precision: 1 },
                              { label: 'Phosphorus Excreted', unit: 'kg P', key: 'phosphorusExcreted', precision: 1 },
                              { label: 'Manure Methane', unit: 'kg CH4', key: 'manureMethane', precision: 3 },
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
    </div>
  );
}
