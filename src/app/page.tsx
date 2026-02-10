
"use client"

import { useState } from 'react';
import { FarmDataInput } from '@/components/calculator/FarmDataInput';
import { EmissionsResults } from '@/components/calculator/EmissionsResults';
import { MitigationAI } from '@/components/calculator/MitigationAI';
import { calculateEmissions, FarmData, EmissionResults } from '@/lib/calculations';
import { Leaf, BarChart3, Info, BookOpen, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [results, setResults] = useState<EmissionResults | null>(null);
  const [activeData, setActiveData] = useState<FarmData | null>(null);

  const handleCalculate = (data: FarmData) => {
    const calculated = calculateEmissions(data);
    setResults(calculated);
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
              <p className="text-primary-foreground/80 text-sm">Agricultural Emission Intensity Calculator</p>
            </div>
          </div>
          <nav className="flex gap-6 text-primary-foreground/90 font-medium">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Info className="w-4 h-4" /> About</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><BookOpen className="w-4 h-4" /> Methodology</a>
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
                <Info className="w-4 h-4" /> Why calculate EI?
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Emission Intensities (EI) help farmers understand the environmental footprint of their production per animal unit. Lowering intensities often correlates with improved feed conversion and resource efficiency.
              </p>
            </div>
          </div>

          {/* Right Column: Results & Analysis */}
          <div className="lg:col-span-7 xl:col-span-8">
            {!results ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl bg-white/50 p-12 text-center">
                <BarChart3 className="w-20 h-20 text-primary/20 mb-6" />
                <h2 className="text-2xl font-bold text-primary mb-2">No Calculations Yet</h2>
                <p className="text-muted-foreground max-w-md">
                  Complete the farm configuration form on the left to estimate your emission intensities and receive AI-driven mitigation advice.
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-primary/10">
                    <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Emissions Results
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      AI Mitigation Analysis
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="results" className="mt-0">
                    <EmissionsResults results={results} />
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="mt-0">
                    {activeData && <MitigationAI data={activeData} results={results} />}
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
              © {new Date().getFullYear()} FarmEI Estimator. Empowering sustainable agriculture through science.
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-sm" />
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <div className="w-4 h-4 bg-secondary rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
