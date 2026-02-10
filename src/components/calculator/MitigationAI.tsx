"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import { FarmData, EmissionResults } from '@/lib/calculations';
import { aiScenarioAnalysis, AIScenarioAnalysisOutput } from '@/ai/ai-scenario-analysis';

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
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-inner">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <CardTitle className="text-lg">AI Mitigation Insights</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Strategy optimization based on FCR and emissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!aiResponse ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
            <Sparkles className="w-10 h-10 text-primary opacity-20" />
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Generate customized strategies to improve FCR and reduce footprint.
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-primary text-white h-9 px-4 text-sm w-full">
              {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isAnalyzing ? 'Analyzing Efficiency...' : 'Get AI Suggestions'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/10">
              <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-1">
                <TargetIcon className="w-3 h-3" /> Key Suggestions
              </h4>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {aiResponse.suggestedPractices}
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl border border-primary/10">
              <h4 className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-1">
                <InfoIcon className="w-3 h-3" /> Technical Context
              </h4>
              <p className="text-xs italic leading-relaxed text-muted-foreground">
                {aiResponse.justification}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {aiResponse && (
        <CardFooter className="py-3">
          <Button variant="ghost" className="text-[10px] text-primary w-full h-8" onClick={runAnalysis}>
            <RefreshCw className="w-3 h-3 mr-1" /> Re-run Analysis
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
    strokeWidth="2" 
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
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);