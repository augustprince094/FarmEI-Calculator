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
    <Card className="glass border-primary/20 bg-primary/5 shadow-inner rounded-2xl overflow-hidden group">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-primary uppercase tracking-wider">Mitigation AI</CardTitle>
            <CardDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Precision Strategy Insights
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {!aiResponse ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-primary opacity-20 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full" />
            </div>
            <p className="text-[10px] text-muted-foreground max-w-[200px] font-medium leading-relaxed">
              Generate advanced nutritional strategies to optimize FCR and reduce environmental intensity.
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-primary text-white h-10 px-6 text-xs w-full rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold uppercase tracking-widest">
              {isAnalyzing ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
              {isAnalyzing ? 'Analyzing...' : 'Get AI Strategy'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            <div className="bg-white/60 backdrop-blur-xl p-4 rounded-xl border border-white/50 shadow-sm">
              <h4 className="text-[9px] font-black text-primary uppercase mb-2 flex items-center gap-2 tracking-[0.2em]">
                <TargetIcon className="w-3.5 h-3.5" /> Strategic Focus
              </h4>
              <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-medium text-slate-700">
                {aiResponse.suggestedPractices}
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl border border-primary/10 backdrop-blur-md">
              <h4 className="text-[9px] font-black text-primary uppercase mb-2 flex items-center gap-2 tracking-[0.2em]">
                <InfoIcon className="w-3.5 h-3.5" /> Technical Justification
              </h4>
              <p className="text-[10px] italic leading-relaxed text-muted-foreground font-medium">
                {aiResponse.justification}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {aiResponse && (
        <CardFooter className="py-2 bg-white/30 backdrop-blur-md">
          <Button variant="ghost" className="text-[9px] font-black text-primary w-full h-8 rounded-lg hover:bg-primary/10 uppercase tracking-widest" onClick={runAnalysis}>
            <RefreshCw className="w-2.5 h-2.5 mr-1.5" /> Refresh Analysis
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
