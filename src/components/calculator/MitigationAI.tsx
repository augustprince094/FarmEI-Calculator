"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import { FarmData, EmissionResults } from '@/lib/calculations';
import { aiScenarioAnalysis, AIScenarioAnalysisOutput } from '@/ai/ai-scenario-analysis';
import { cn } from '@/lib/utils';

interface Props {
  data: FarmData;
  results: EmissionResults;
}

export function MitigationAI({ data, results }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIScenarioAnalysisOutput | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const currentPractices = `
        Animal Type: ${data.animalType}
        Animals per Cycle: ${data.count}
        FCR: ${data.fcr}
        Cycles per Year: ${data.cyclesPerYear}
        Market Weight: ${data.avgWeight} kg
        Feed Protein: ${data.feedCrudeProtein}%
        Feed Phosphorus: ${data.feedPhosphorus}%
        Manure Management: ${data.manureManagement}
      `;

      const relevantResearchData = `
        Yearly Nitrogen Excretion: ${results.nitrogenExcreted.toFixed(2)} kg
        Yearly Phosphorus Excretion: ${results.phosphorusExcreted.toFixed(2)} kg
        Total Carbon Footprint: ${results.totalCarbonEquivalent.toFixed(2)} kg CO2e
        Additive Treatment: ${data.additive === 'none' ? 'Baseline' : data.additive}
      `;

      const response = await aiScenarioAnalysis({
        currentPractices,
        relevantResearchData
      });
      
      setAiResponse(response);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="glass border-primary/20 bg-primary/5 shadow-inner rounded-3xl overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
            <BrainCircuit className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-primary uppercase tracking-wider">Mitigation AI</CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Precision Strategy Insights
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!aiResponse ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
            <div className="relative">
              <Sparkles className="w-14 h-14 text-primary opacity-20 animate-pulse" />
              <div className="absolute inset-0 blur-2xl bg-primary/10 rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[220px] font-medium leading-relaxed">
              Generate advanced nutritional strategies to optimize FCR and reduce environmental intensity.
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-primary text-white h-12 px-8 text-sm w-full rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold uppercase tracking-widest">
              {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isAnalyzing ? 'Analyzing Metrics...' : 'Get AI Strategy'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-sm">
              <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center gap-2 tracking-[0.2em]">
                <TargetIcon className="w-4 h-4" /> Strategic Focus
              </h4>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700">
                {aiResponse.suggestedPractices}
              </div>
            </div>

            <div className="p-5 bg-primary/10 rounded-2xl border border-primary/10 backdrop-blur-md">
              <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center gap-2 tracking-[0.2em]">
                <InfoIcon className="w-4 h-4" /> Technical Justification
              </h4>
              <p className="text-xs italic leading-relaxed text-muted-foreground font-medium">
                {aiResponse.justification}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {aiResponse && (
        <CardFooter className="py-4 bg-white/30 backdrop-blur-md">
          <Button variant="ghost" className="text-xs font-black text-primary w-full h-10 rounded-xl hover:bg-primary/10 uppercase tracking-widest" onClick={runAnalysis}>
            <RefreshCw className="w-3 h-3 mr-2" /> Refresh Analysis
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

const TargetIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);