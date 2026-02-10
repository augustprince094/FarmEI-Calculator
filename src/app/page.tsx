
"use client"

import { useState } from 'react';
import { FarmDataInput } from '@/components/calculator/FarmDataInput';
import { EmissionsResults } from '@/components/calculator/EmissionsResults';
import { MitigationAI } from '@/components/calculator/MitigationAI';
import { calculateEmissions, FarmData, ComparativeResults } from '@/lib/calculations';
import { Leaf, BarChart3, Info, BookOpen, ShieldCheck, Comparison } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [results, setResults] = useState<ComparativeResults | null>(null);
  const [activeData, setActiveData] = useState<FarmData | null>(null);

  const handleCalculate = (data: FarmData) => {
    // Calculate baseline (no additive)
    const baselineResults = calculateEmissions(data, false);
    // Calculate scenario (with selected additive)
    const scenarioResults = calculateEmissions(data, true);
    
    setResults({
      baseline: baselineResults,
      scenario: scenarioResults,
      additiveType: data.additive
    });
    setActiveData(data);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary py-8 border-b border-primary/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">FarmEI Estimator</h1>
              <p className="text-primary-foreground/80 text-sm">Comparative Comparative Intensity Tool</p>
            </div>
          </div>
          <nav className="flex gap-6 text-primary-foreground/90 font-medium">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Info className="w-4 h-4" /> About</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><BookOpen className="w-4 h-4" /> Additives</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Compliance</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4">
            <FarmDataInput onCalculate={handleCalculate} />
            
            <div className="mt-8 p-6 bg-secondary/10 rounded-xl border border-secondary/20">
              <h4 className="font-bold text-secondary mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Comparative Analysis
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By comparing a baseline production system against one supplemented with additives like <b>Jefo Pro Solution</b> or <b>P(OA+EO)</b>, producers can quantify potential reductions in Nitrogen, Phosphorus, and Greenhouse Gas emissions.
              </p>
            </div>
          </div>

          {/* Right Column: Results & Analysis */}
          <div className="lg:col-span-7 xl:col-span-8">
            {!results ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl bg-white/50 p-12 text-center">
                <BarChart3 className="w-20 h-20 text-primary/20 mb-6" />
                <h2 className="text-2xl font-bold text-primary mb-2">Ready for Comparison</h2>
                <p className="text-muted-foreground max-w-md">
                  Set your farm parameters and select a feed additive to see a side-by-side analysis of your environmental footprint.
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-primary/10">
                    <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Comparative Results
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Scenario Deep-Dive
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="results" className="mt-0">
                    <EmissionsResults results={results} />
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="mt-0">
                    {activeData && <MitigationAI data={activeData} results={results.scenario} />}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 grayscale opacity-70">
              <Leaf className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">FarmEI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FarmEI Estimator. Comparative science for sustainable livestock.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
