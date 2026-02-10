
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparativeResults } from '@/lib/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend
} from 'recharts';
import { Wind, Droplets, Leaf, Download, TrendingDown, Target, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  results: ComparativeResults;
  isComparison?: boolean;
  baselineFcr?: number;
  scenarioFcr?: number;
}

export function EmissionsResults({ results, isComparison = false, baselineFcr, scenarioFcr }: Props) {
  const { baseline, scenario, additiveType } = results;

  const barData = [
    { 
      name: 'Nitrogen (kg/yr)', 
      baseline: Math.round(baseline.nitrogenExcreted), 
      scenario: Math.round(scenario.nitrogenExcreted),
    },
    { 
      name: 'Phosphorus (kg/yr)', 
      baseline: Math.round(baseline.phosphorusExcreted), 
      scenario: Math.round(scenario.phosphorusExcreted),
    },
    { 
      name: 'Carbon (CO2e/yr)', 
      baseline: Math.round(baseline.totalCarbonEquivalent), 
      scenario: Math.round(scenario.totalCarbonEquivalent),
    },
  ];

  const additiveName = additiveType === 'jefo-pro' ? 'Jefo Pro Solution' : additiveType === 'poa-eo' ? 'P(OA+EO)' : 'None';

  const formatValue = (val: number) => val.toLocaleString();

  const reductionPercentage = baseline.totalCarbonEquivalent > 0 
    ? Math.round(((baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent) / baseline.totalCarbonEquivalent) * 100)
    : 0;

  const fcrImprovement = (baselineFcr && scenarioFcr && baselineFcr > 0)
    ? Math.round(((baselineFcr - scenarioFcr) / baselineFcr) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {isComparison ? 'Mitigation Comparative Summary' : 'Baseline Environmental Profile'}
          </h2>
          <p className="text-muted-foreground">
            {isComparison ? (
              <>Comparing Baseline vs. <span className="font-bold text-secondary">{additiveName}</span></>
            ) : (
              'Currently established farm baseline'
            )}
          </p>
        </div>
        {isComparison && (
          <div className="flex items-center gap-4">
            {fcrImprovement > 0 && (
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-secondary/20">
                 <Calculator className="w-5 h-5 text-secondary" />
                 <div>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">FCR Gain</p>
                    <p className="text-lg font-black text-secondary">-{fcrImprovement}%</p>
                 </div>
              </div>
            )}
            {reductionPercentage > 0 && (
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-primary/10">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingDown className="w-8 h-8 text-green-700" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CO2e Reduction</p>
                  <p className="text-3xl font-black text-green-700">-{reductionPercentage}%</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-b-4 border-b-primary shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {isComparison ? 'Nitrogen Saved' : 'Nitrogen Excreted'}
                </p>
                <h3 className="text-2xl font-bold text-primary">
                  {formatValue(Math.round(isComparison ? baseline.nitrogenExcreted - scenario.nitrogenExcreted : baseline.nitrogenExcreted))} 
                  <span className="text-sm font-normal ml-1 text-muted-foreground">kg/yr</span>
                </h3>
              </div>
              <Wind className="text-primary/20 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-b-4 border-b-secondary shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {isComparison ? 'Phosphorus Saved' : 'Phosphorus Excreted'}
                </p>
                <h3 className="text-2xl font-bold text-secondary">
                  {formatValue(Math.round(isComparison ? baseline.phosphorusExcreted - scenario.phosphorusExcreted : baseline.phosphorusExcreted))} 
                  <span className="text-sm font-normal ml-1 text-muted-foreground">kg/yr</span>
                </h3>
              </div>
              <Droplets className="text-secondary/20 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-b-4 border-b-green-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {isComparison ? 'Carbon Mitigated' : 'Total CO₂ Equivalent'}
                </p>
                <h3 className="text-2xl font-bold text-green-700">
                  {formatValue(Math.round(isComparison ? baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent : baseline.totalCarbonEquivalent))} 
                  <span className="text-sm font-normal ml-1 text-muted-foreground">kg/yr</span>
                </h3>
              </div>
              <Leaf className="text-green-700/20 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {isComparison ? 'Mitigation vs. Baseline' : 'Emission Intensity Metrics'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isComparison ? `Comparing ${additiveName} (FCR: ${scenarioFcr}) to baseline (FCR: ${baselineFcr})` : 'Current environmental impact breakdown'}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-muted text-muted-foreground">Baseline</Badge>
            {isComparison && <Badge variant="default" className="bg-primary">{additiveName}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="h-[400px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{ fill: '#F5F5DC' }} />
              <Legend verticalAlign="top" height={36}/>
              <Bar name="Baseline" dataKey="baseline" fill="#A0522D" radius={[4, 4, 0, 0]} />
              {isComparison && <Bar name={additiveName} dataKey="scenario" fill="#3F704D" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-between items-center">
        <p className="text-xs text-muted-foreground italic">
          *Calculations based on mass balance of Feed Conversion Ratio (FCR) and specified body nitrogen retention constants.
        </p>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Export Technical Report
        </Button>
      </div>
    </div>
  );
}
