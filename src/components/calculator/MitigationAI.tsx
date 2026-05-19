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
        Market Weight: ${data.avgWeight} kg
        Manure Management: ${data.manureManagement}
      `;

      const relevantResearchData = `
        Yearly Nitrogen Excretion: ${results.nitrogenExcreted.toFixed(2)} kg
        Ammonia Emissions: ${results.ammoniaEmissions.toFixed(2)} kg NH3
        Net GHG Emissions: ${results.netGhgEmissions.toFixed(2)} kg CO2e
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
    <Card className="glass border-primary/20 bg-primary/5 shadow-inner rounded-2xl overflow-hidden group">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg backdrop-blur-md group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xs font-black text-primary uppercase tracking-wider">Mitigation AI</CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Strategy Insights
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4 px-4">
        {!aiResponse ? (
          <div className="flex flex-col items-center justify-center py-5 space-y-4 text-center">
            <Sparkles className="w-10 h-10 text-primary opacity-20 animate-pulse" />
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Generate advanced strategies to optimize FCR and reduce intensities.
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-primary text-white h-10 px-6 text-xs w-full rounded-xl shadow-md font-bold uppercase tracking-widest">
              {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
              {isAnalyzing ? 'Analyzing...' : 'AI Strategy'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/60 backdrop-blur-xl p-4 rounded-xl border border-white/50 shadow-sm">
              <h4 className="text-[10px] font-black text-primary uppercase mb-2 flex items-center gap-2 tracking-widest">
                <TargetIcon className="w-4 h-4" /> Focus
              </h4>
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium text-slate-700">
                {aiResponse.suggestedPractices}
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl border border-primary/10 backdrop-blur-md">
              <h4 className="text-[10px] font-black text-primary uppercase mb-2 flex items-center gap-2 tracking-widest">
                <InfoIcon className="w-4 h-4" /> Logic
              </h4>
              <p className="text-xs italic leading-relaxed text-muted-foreground font-medium">
                {aiResponse.justification}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {aiResponse && (
        <CardFooter className="py-3 bg-white/30 backdrop-blur-md border-t border-white/10">
          <Button variant="ghost" className="text-[10px] font-black text-primary w-full h-8 rounded-lg hover:bg-primary/10 uppercase tracking-widest" onClick={runAnalysis}>
            <RefreshCw className="w-3 h-3 mr-2" /> Refresh
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