"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparativeResults } from '@/lib/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { Wind, Droplets, Leaf, Download, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  results: ComparativeResults;
  isComparison?: boolean;
  baselineFcr?: number;
  scenarioFcr?: number;
}

export function EmissionsResults({ results, isComparison = false, baselineFcr, scenarioFcr }: Props) {
  const { baseline, scenario, additiveType } = results;

  const getAdditiveName = (type: string) => {
    switch (type) {
      case 'jefo-pro': return 'Jefo Pro';
      case 'poa-eo': return 'P(OA+EO)';
      case 'xylanase': return 'Xylanase';
      case 'jefo-combo': return 'Jefo Combo';
      default: return 'Baseline';
    }
  };

  const additiveName = getAdditiveName(additiveType);

  const formatValue = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const formatCarbon = (val: number) => Math.round(val).toLocaleString();

  const reductionPercentage = baseline.totalCarbonEquivalent > 0 
    ? Math.round(((baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent) / baseline.totalCarbonEquivalent) * 100)
    : 0;

  const fcrImprovement = (baselineFcr && scenarioFcr && baselineFcr > scenarioFcr)
    ? Math.round(((baselineFcr - scenarioFcr) / baselineFcr) * 100)
    : 0;

  // Colors
  const baselineColor = '#A0A0A0';
  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'poa-eo': return '#D38F89';
      case 'xylanase': return '#4A90E2';
      case 'jefo-combo': return '#F5A623';
      default: return '#FBBC01'; // Jefo Pro
    }
  };
  const scenarioColor = getScenarioColor(additiveType);

  // Data for individual charts
  const nitrogenData = [
    { name: 'Baseline', value: Number(baseline.nitrogenExcreted.toFixed(1)), fill: baselineColor, unit: 'kg' },
    { name: additiveName, value: Number(scenario.nitrogenExcreted.toFixed(1)), fill: scenarioColor, unit: 'kg' }
  ];

  const phosphorusData = [
    { name: 'Baseline', value: Number(baseline.phosphorusExcreted.toFixed(1)), fill: baselineColor, unit: 'kg' },
    { name: additiveName, value: Number(scenario.phosphorusExcreted.toFixed(1)), fill: scenarioColor, unit: 'kg' }
  ];

  const carbonData = [
    { name: 'Baseline', value: Math.round(baseline.totalCarbonEquivalent), fill: baselineColor, unit: 'kg CO2e' },
    { name: additiveName, value: Math.round(scenario.totalCarbonEquivalent), fill: scenarioColor, unit: 'kg CO2e' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-2 rounded-lg border-white/40 shadow-2xl">
          <p className="font-bold text-[10px] mb-0.5 text-primary uppercase tracking-wider">{label}</p>
          <p className="text-sm font-black text-primary">
            {payload[0].value.toLocaleString()} <span className="text-[9px] font-medium text-muted-foreground uppercase">{payload[0].payload.unit || ''}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-2xl border border-white/50 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight uppercase">
            {isComparison ? 'Mitigation Performance' : 'Environmental Profile'}
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {isComparison ? (
              <>Impact Analysis: <span className="font-black" style={{ color: scenarioColor }}>{additiveName}</span> Strategy</>
            ) : (
              'Cycle-specific environmental benchmarks established.'
            )}
          </p>
        </div>
        {isComparison && (
          <div className="flex items-center gap-4">
            {fcrImprovement > 0 && (
              <div className="glass p-3 rounded-xl border-secondary/20 flex items-center gap-3 hover:scale-105 transition-transform">
                 <div className="p-2 bg-secondary/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-secondary" />
                 </div>
                 <div>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Efficiency</p>
                    <p className="text-lg font-black text-secondary">-{fcrImprovement}% FCR</p>
                 </div>
              </div>
            )}
            {reductionPercentage > 0 && (
              <div className="glass p-3 rounded-xl border-green-200/50 flex items-center gap-4 hover:scale-105 transition-transform bg-green-50/40">
                <div className="p-2 bg-green-500 rounded-full shadow-lg shadow-green-500/30">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">CO2e Mitigated</p>
                  <p className="text-2xl font-black text-green-700">-{reductionPercentage}%</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            label: 'Nitrogen Load', 
            val: isComparison ? scenario.nitrogenExcreted : baseline.nitrogenExcreted, 
            unit: 'kg', 
            icon: Wind, 
            color: 'text-primary',
            border: '#808080',
            diff: isComparison ? baseline.nitrogenExcreted - scenario.nitrogenExcreted : 0
          },
          { 
            label: 'Phosphorus Load', 
            val: isComparison ? scenario.phosphorusExcreted : baseline.phosphorusExcreted, 
            unit: 'kg', 
            icon: Droplets, 
            color: 'text-secondary',
            border: '#A0522D',
            diff: isComparison ? baseline.phosphorusExcreted - scenario.phosphorusExcreted : 0
          },
          { 
            label: 'Carbon Intensity', 
            val: isComparison ? scenario.totalCarbonEquivalent : baseline.totalCarbonEquivalent, 
            unit: 'kg CO2e', 
            icon: Leaf, 
            color: 'text-green-700',
            border: '#15803d',
            diff: isComparison ? baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent : 0
          }
        ].map((item, idx) => (
          <Card key={idx} className="glass overflow-hidden border-none shadow-md transition-all hover:scale-[1.02] duration-300">
            <div className="h-1.5 w-full" style={{ backgroundColor: item.border }} />
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.label}</p>
                  <h3 className={cn("text-2xl font-black", item.color)}>
                    {item.unit === 'kg CO2e' ? formatCarbon(item.val) : formatValue(item.val)} 
                    <span className="text-[10px] font-bold ml-1 opacity-60">{item.unit}</span>
                  </h3>
                  {isComparison && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      <p className="text-[9px] text-green-700 font-black uppercase tracking-wider">
                        {item.diff > 0 
                          ? `-${item.unit === 'kg CO2e' ? formatCarbon(item.diff) : formatValue(item.diff)} ${item.unit}` 
                          : 'Maintaining baseline'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-primary/5 rounded-xl backdrop-blur-md">
                  <item.icon className={cn("w-6 h-6 opacity-40", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Nitrogen (kg N)', data: nitrogenData, icon: Wind, color: 'text-primary' },
          { label: 'Phosphorus (kg P)', data: phosphorusData, icon: Droplets, color: 'text-secondary' },
          { label: 'Carbon (kg CO2e)', data: carbonData, icon: Leaf, color: 'text-green-700' }
        ].map((chart, idx) => (
          <Card key={idx} className="glass rounded-2xl border-white/30 shadow-xl p-4">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-primary/80">
                <chart.icon className={cn("w-4 h-4", chart.color)} /> {chart.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[220px] px-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={32}>
                    {chart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4">
        <div className="glass p-3 rounded-xl flex items-center gap-2 bg-primary/5">
          <Leaf className="w-4 h-4 text-primary opacity-50" />
          <p className="text-[10px] text-muted-foreground italic font-medium">
            Calculated intensities are batch-specific. Includes N and P partitioning plus CH4/N2O sequestration modeling.
          </p>
        </div>
        <Button variant="outline" className="glass h-11 px-6 rounded-xl font-black text-xs text-primary border-primary/20 hover:bg-primary/10 flex items-center gap-2 transition-all uppercase tracking-widest" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Export Cycle Audit
        </Button>
      </div>
    </div>
  );
}
