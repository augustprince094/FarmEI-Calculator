"use client"

import { useState } from 'react';
import { FarmDataInput } from '@/components/calculator/FarmDataInput';
import { EmissionsResults } from '@/components/calculator/EmissionsResults';
import { MitigationAI } from '@/components/calculator/MitigationAI';
import { calculateEmissions, FarmData, ComparativeResults, EmissionResults, AnimalType } from '@/lib/calculations';
import { Leaf, Info, BookOpen, ShieldCheck, ArrowRight, RefreshCw, Layers, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
    // Suggest a default improvement if FCR hasn't been manually adjusted yet
    if (additive !== 'none' && targetFcr === baselineData.fcr) {
      const reduction = additive === 'jefo-pro' ? 0.97 : 0.95;
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary py-8 border-b border-primary/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">FarmEI Estimator</h1>
              <p className="text-primary-foreground/80 text-sm">Comparative Environmental Assessment</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-primary-foreground/90 font-medium">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Info className="w-4 h-4" /> Science</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><BookOpen className="w-4 h-4" /> Additives</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Methodology</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        {step === 'input' ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-primary mb-3">Environmental Footprint Baseline</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Establish your baseline by defining efficiency metrics. For broilers, the standard production cycle is 42 days.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 lg:col-start-3">
                <FarmDataInput onCalculate={handleEstablishBaseline} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Cycle Baseline
                  </h3>
                  <Button variant="ghost" size="sm" onClick={reset} className="text-xs h-8">
                    <RefreshCw className="w-3 h-3 mr-1" /> Edit Params
                  </Button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-bold">{baselineData ? animalTypeLabels[baselineData.animalType] : ''}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Baseline FCR:</span>
                    <span className="font-bold text-secondary">{baselineData?.fcr}</span>
                  </div>
                  
                  {baselineData?.animalType === 'broilers' && (
                    <div className="p-3 bg-primary/5 rounded border border-primary/10 space-y-2">
                      <div className="text-[10px] font-bold uppercase text-primary/60 border-b pb-1">Dietary Phases</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                        <span className="text-muted-foreground">CP Starter/Gr/Fin:</span>
                        <span className="font-bold text-right">{baselineData.broilerCPStarter}/{baselineData.broilerCPGrower}/{baselineData.broilerCPFinisher}%</span>
                        
                        <span className="text-muted-foreground">P Starter/Gr/Fin:</span>
                        <span className="font-bold text-right">{baselineData.broilerPStarter}/{baselineData.broilerPGrower}/{baselineData.broilerPFinisher}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Exit Weight:</span>
                    <span className="font-bold">{baselineData?.avgWeight} kg</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Animal Count:</span>
                    <span className="font-bold">{baselineData?.count} head</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Mitigation Scenario
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Adjust FCR for the mitigated cycle to see impact on total emissions.
                </p>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <Button 
                    variant={selectedAdditive === 'jefo-pro' ? 'default' : 'outline'}
                    onClick={() => handleApplyMitigation('jefo-pro')}
                    className="justify-start h-auto py-3 px-4"
                  >
                    <div className="text-left">
                      <div className="font-bold">Jefo Pro Solution</div>
                      <div className="text-[10px] opacity-70">Enzymatic metabolic catalyst</div>
                    </div>
                  </Button>
                  <Button 
                    variant={selectedAdditive === 'poa-eo' ? 'default' : 'outline'}
                    onClick={() => handleApplyMitigation('poa-eo')}
                    className="justify-start h-auto py-3 px-4"
                  >
                    <div className="text-left">
                      <div className="font-bold">P(OA+EO)</div>
                      <div className="text-[10px] opacity-70">Organic acid / EO synergy</div>
                    </div>
                  </Button>
                </div>

                {selectedAdditive !== 'none' && (
                  <div className="space-y-3 p-4 bg-white rounded-xl border border-primary/20 animate-in zoom-in-95 duration-200">
                    <Label className="text-xs font-bold text-primary flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> Improved Cycle FCR
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={scenarioFcr}
                      onChange={(e) => handleFcrChange(parseFloat(e.target.value) || 0)}
                      className="h-10 border-primary/30 focus:ring-primary font-bold text-secondary"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Adjust expected FCR for this cycle.
                    </p>
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
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-primary/10">
                    <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      {comparisonResults ? 'Comparative Summary' : 'Baseline Results'}
                    </TabsTrigger>
                    <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Technical Metrics
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
                    <div className="bg-white p-8 rounded-2xl border shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Cycle Technical Breakdown</h3>
                        <Badge variant="outline" className="text-xs font-normal">Calculated via Mass Balance</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Enteric Methane', val: (comparisonResults?.scenario || baselineResults).entericMethane, unit: 'kg CH4' },
                          { label: 'Manure Methane', val: (comparisonResults?.scenario || baselineResults).manureMethane, unit: 'kg CH4' },
                          { label: 'Direct N2O', val: (comparisonResults?.scenario || baselineResults).directN2O, unit: 'kg N2O' },
                          { label: 'Indirect N2O', val: (comparisonResults?.scenario || baselineResults).indirectN2O, unit: 'kg N2O' },
                          { label: 'Phosphorus Runoff', val: (comparisonResults?.scenario || baselineResults).phosphorusRunoff, unit: 'kg P' },
                          { label: 'Cycle Feed Mass', val: (comparisonResults?.scenario?.fcr || baselineData?.fcr || 0) * (baselineData?.avgWeight || 0) * (baselineData?.count || 0), unit: 'kg Feed' },
                        ].map((item, i) => (
                          <div key={i} className="p-4 bg-muted/30 rounded-lg flex justify-between items-center border border-transparent hover:border-primary/20 transition-colors">
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="font-bold">{item.val.toFixed(2)} <span className="text-[10px] text-muted-foreground">{item.unit}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg text-primary">FarmEI Estimator</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Methodology follows user-defined mass balance formulas per production cycle. Retention constant at 29g/kg. Carbon equivalents use IPCC GWP-100 factors.
          </p>
          <div className="mt-6 text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} FarmEI Environmental intensity comparative tool.
          </div>
        </div>
      </footer>
    </div>
  );
}
