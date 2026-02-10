
"use client"

import { useState, useEffect } from 'react';
import { FarmDataInput } from '@/components/calculator/FarmDataInput';
import { EmissionsResults } from '@/components/calculator/EmissionsResults';
import { MitigationAI } from '@/components/calculator/MitigationAI';
import { calculateEmissions, FarmData, ComparativeResults, EmissionResults } from '@/lib/calculations';
import { Leaf, Info, BookOpen, ShieldCheck, ArrowRight, RefreshCw, Layers, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    setScenarioFcr(data.fcr); // Default scenario FCR to baseline
    setStep('results');
    setComparisonResults(null);
    setSelectedAdditive('none');
  };

  const handleApplyMitigation = (additive: FarmData['additive']) => {
    if (!baselineData || !baselineResults) return;
    
    setSelectedAdditive(additive);
    
    // If switching to an additive, we might want to suggest a slight FCR improvement
    // but the user will be able to edit it manually.
    let targetFcr = scenarioFcr;
    if (additive !== 'none' && targetFcr === baselineData.fcr) {
      targetFcr = parseFloat((baselineData.fcr * 0.97).toFixed(2)); // Suggest 3% improvement initially
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

  // Update scenario results when FCR changes
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
              <p className="text-primary-foreground/80 text-sm">Environmental Intensity Comparative Tool</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-primary-foreground/90 font-medium">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Info className="w-4 h-4" /> About</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><BookOpen className="w-4 h-4" /> Additives</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Compliance</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        {step === 'input' ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-primary mb-3">Farm Environmental Baseline</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Define your current production efficiency using <strong>FCR (Feed Conversion Ratio)</strong> to calculate your environmental footprint.
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
                    <Layers className="w-4 h-4" /> Farm Baseline
                  </h3>
                  <Button variant="ghost" size="sm" onClick={reset} className="text-xs h-8">
                    <RefreshCw className="w-3 h-3 mr-1" /> New Params
                  </Button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Species:</span>
                    <span className="font-bold capitalize">{baselineData?.animalType}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Baseline FCR:</span>
                    <span className="font-bold text-secondary">{baselineData?.fcr}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Market Weight:</span>
                    <span className="font-bold">{baselineData?.avgWeight} kg</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Mitigation Scenario
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Select an additive and provide the improved FCR to model impact.
                </p>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <Button 
                    variant={selectedAdditive === 'jefo-pro' ? 'default' : 'outline'}
                    onClick={() => handleApplyMitigation('jefo-pro')}
                    className="justify-start h-auto py-3 px-4"
                  >
                    <div className="text-left">
                      <div className="font-bold">Jefo Pro Solution</div>
                      <div className="text-[10px] opacity-70">Nutrient utilization catalyst</div>
                    </div>
                  </Button>
                  <Button 
                    variant={selectedAdditive === 'poa-eo' ? 'default' : 'outline'}
                    onClick={() => handleApplyMitigation('poa-eo')}
                    className="justify-start h-auto py-3 px-4"
                  >
                    <div className="text-left">
                      <div className="font-bold">P(OA+EO)</div>
                      <div className="text-[10px] opacity-70">Organic acid blend</div>
                    </div>
                  </Button>
                </div>

                {selectedAdditive !== 'none' && (
                  <div className="space-y-3 p-4 bg-white rounded-xl border border-primary/20 animate-in zoom-in-95 duration-200">
                    <Label className="text-xs font-bold text-primary flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> Expected FCR with Additive
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={scenarioFcr}
                      onChange={(e) => handleFcrChange(parseFloat(e.target.value) || 0)}
                      className="h-10 border-primary/30 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Baseline was {baselineData?.fcr}. Improving FCR reduces total feed and nutrient load.
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
                      {comparisonResults ? 'Comparative Analysis' : 'Baseline Results'}
                    </TabsTrigger>
                    <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Detailed Breakdown
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
                      <h3 className="text-xl font-bold mb-4">Technical Breakdown (Yearly)</h3>
                      <p className="text-muted-foreground mb-6">
                        Estimated metrics for {comparisonResults ? 'mitigation scenario' : 'baseline production'}.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Enteric Methane', val: (comparisonResults?.scenario || baselineResults).entericMethane, unit: 'kg CH4' },
                          { label: 'Manure Methane', val: (comparisonResults?.scenario || baselineResults).manureMethane, unit: 'kg CH4' },
                          { label: 'Direct N2O', val: (comparisonResults?.scenario || baselineResults).directN2O, unit: 'kg N2O' },
                          { label: 'Indirect N2O', val: (comparisonResults?.scenario || baselineResults).indirectN2O, unit: 'kg N2O' },
                          { label: 'Phosphorus Runoff', val: (comparisonResults?.scenario || baselineResults).phosphorusRunoff, unit: 'kg P' },
                        ].map((item, i) => (
                          <div key={i} className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
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
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 grayscale opacity-70">
              <Leaf className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">FarmEI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FarmEI Estimator. FCR-based environmental modeling.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
