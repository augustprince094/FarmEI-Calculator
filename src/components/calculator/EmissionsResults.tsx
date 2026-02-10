
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparativeResults } from '@/lib/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, ReferenceLine
} from 'recharts';
import { Wind, Droplets, Leaf, Download, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  results: ComparativeResults;
}

export function EmissionsResults({ results }: Props) {
  const { baseline, scenario, additiveType } = results;

  const barData = [
    { 
      name: 'Nitrogen (kg/yr)', 
      baseline: Math.round(baseline.nitrogenExcreted), 
      scenario: Math.round(scenario.nitrogenExcreted),
      reduction: Math.round(((baseline.nitrogenExcreted - scenario.nitrogenExcreted) / baseline.nitrogenExcreted) * 100)
    },
    { 
      name: 'Phosphorus (kg/yr)', 
      baseline: Math.round(baseline.phosphorusExcreted), 
      scenario: Math.round(scenario.phosphorusExcreted),
      reduction: Math.round(((baseline.phosphorusExcreted - scenario.phosphorusExcreted) / baseline.phosphorusExcreted) * 100)
    },
    { 
      name: 'Carbon (CO2e/yr)', 
      baseline: Math.round(baseline.totalCarbonEquivalent), 
      scenario: Math.round(scenario.totalCarbonEquivalent),
      reduction: Math.round(((baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent) / baseline.totalCarbonEquivalent) * 100)
    },
  ];

  const additiveName = additiveType === 'jefo-pro' ? 'Jefo Pro Solution' : 'P(OA+EO)';

  const formatValue = (val: number) => val.toLocaleString();

  const reductionPercentage = Math.round(((baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent) / baseline.totalCarbonEquivalent) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Comparative Summary</h2>
          <p className="text-muted-foreground">Baseline vs. <span className="font-bold text-secondary">{additiveName}</span></p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-primary/10">
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingDown className="w-8 h-8 text-green-700" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total CO2e Reduction</p>
            <p className="text-3xl font-black text-green-700">-{reductionPercentage}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-b-4 border-b-primary shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Nitrogen Saved</p>
                <h3 className="text-2xl font-bold text-primary">
                  {formatValue(Math.round(baseline.nitrogenExcreted - scenario.nitrogenExcreted))} 
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
                <p className="text-xs font-bold text-muted-foreground uppercase">Phosphorus Saved</p>
                <h3 className="text-2xl font-bold text-secondary">
                  {formatValue(Math.round(baseline.phosphorusExcreted - scenario.phosphorusExcreted))} 
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
                <p className="text-xs font-bold text-muted-foreground uppercase">Carbon Mitigation</p>
                <h3 className="text-2xl font-bold text-green-700">
                  {formatValue(Math.round(baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent))} 
                  <span className="text-sm font-normal ml-1 text-muted-foreground">kg CO₂e</span>
                </h3>
              </div>
              <Leaf className="text-green-700/20 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Emission Intensity Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">Baseline vs. {additiveName} supplementation</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-muted text-muted-foreground">Baseline</Badge>
            <Badge variant="default" className="bg-primary">{additiveName}</Badge>
          </div>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{ fill: '#F5F5DC' }} />
              <Legend verticalAlign="top" height={36}/>
              <Bar name="Baseline Scenario" dataKey="baseline" fill="#A0522D" radius={[4, 4, 0, 0]} />
              <Bar name={`${additiveName} Scenario`} dataKey="scenario" fill="#3F704D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-between items-center">
        <p className="text-xs text-muted-foreground italic">
          *Calculations based on IPCC Tier 1 defaults and additive-specific mitigation factors.
        </p>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Export Comparative Report
        </Button>
      </div>
    </div>
  );
}
