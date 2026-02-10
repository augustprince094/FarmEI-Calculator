
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FarmData, EmissionResults } from '@/lib/calculations';

interface Props {
  data: FarmData;
  results: EmissionResults;
}

export function MitigationAI({ data, results }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate GenAI flow call
    setTimeout(() => {
      const recs = [
        `Reduce crude protein in feed by 2% to decrease Nitrogen excretion by approximately ${Math.round(results.nitrogenExcreted * 0.15)} kg/year.`,
        `Switch from ${data.manureManagement} to an anaerobic digester system to capture methane and reduce CO2e significantly.`,
        `Optimize Phosphorus intake by using phytase enzymes, potentially reducing P excretion by 20%.`,
        `Implement precision feeding techniques based on animal growth stages to minimize nutrient wastage.`,
        `Consider incorporating feed additives like tannins or essential oils to mitigate enteric methane (specifically for swine).`
      ];
      setRecommendations(recs);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <CardTitle>AI Scenario Analysis</CardTitle>
        </div>
        <CardDescription>
          Based on your current practices, our AI suggests these strategies to reduce your farm's emission intensities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!recommendations ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <Sparkles className="w-12 h-12 text-primary opacity-20" />
            <p className="text-muted-foreground max-w-sm">
              Launch our AI analysis engine to generate tailored mitigation strategies for your specific farm configuration.
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-primary text-white">
              {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isAnalyzing ? 'Analyzing Farm Data...' : 'Run AI Analysis'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-white rounded-lg shadow-sm border border-primary/10 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {recommendations && (
        <CardFooter className="bg-primary/10 py-3 rounded-b-lg">
          <Button variant="ghost" className="text-xs text-primary w-full" onClick={runAnalysis}>
            <RefreshCw className="w-3 h-3 mr-1" /> Re-run Analysis
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
