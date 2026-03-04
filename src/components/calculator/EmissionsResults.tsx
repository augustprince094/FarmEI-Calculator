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
  const baselineColor = '#94a3b8'; // slate-400
  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'poa-eo': return '#f87171';
      case 'xylanase': return '#F26648';
      case 'jefo-combo': return '#fbbf24';
      default: return '#fbbf24';
    }
  };
  const scenarioColor = getScenarioColor(additiveType);

  // Data for individual charts
  const nitrogenData = [
    { name: 'Baseline', value: Number(baseline.nitrogenExcreted.toFixed(1)), fill: baselineColor, unit: 'kg' },
    { name: 'Mitigation', value: Number(scenario.nitrogenExcreted.toFixed(1)), fill: scenarioColor, unit: 'kg' }
  ];

  const phosphorusData = [
    { name: 'Baseline', value: Number(baseline.phosphorusExcreted.toFixed(1)), fill: baselineColor, unit: 'kg' },
    { name: 'Mitigation', value: Number(scenario.phosphorusExcreted.toFixed(1)), fill: scenarioColor, unit: 'kg' }
  ];

  const carbonData = [
    { name: 'Baseline', value: Math.round(baseline.totalCarbonEquivalent), fill: baselineColor, unit: 'kg CO2e' },
    { name: 'Mitigation', value: Math.round(scenario.totalCarbonEquivalent), fill: scenarioColor, unit: 'kg CO2e' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-xl border-white/40 shadow-2xl backdrop-blur-xl">
          <p className="font-bold text-xs mb-1 text-primary uppercase tracking-wider">{label}</p>
          <p className="text-base font-black text-primary">
            {payload[0].value.toLocaleString()} <span className="text-[11px] font-medium text-muted-foreground uppercase">{payload[0].payload.unit || ''}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-2xl border border-white/50 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight uppercase">
            {isComparison ? 'Performance Comparison' : 'Impact Profile'}
          </h2>
          <p className="text-xs text-muted-foreground font-bold mt-1">
            {isComparison ? (
              <span className="flex items-center gap-2" style={{ color: scenarioColor }}>
                <TrendingDown className="w-4 h-4" /> {additiveName} Strategy Assessment
              </span>
            ) : (
              'Cycle Benchmarks & Intensities'
            )}
          </p>
        </div>
        {isComparison && (
          <div className="flex items-center gap-6">
            {fcrImprovement > 0 && (
              <div className="glass px-5 py-3 rounded-xl border-secondary/20 flex flex-col items-end">
                 <div className="flex items-center gap-2">
                   <Calculator className="w-4 h-4 text-secondary" />
                   <p className="text-[11px] font-black text-secondary uppercase tracking-tight">Efficiency</p>
                 </div>
                 <p className="text-xl font-black text-secondary leading-tight">-{fcrImprovement}% FCR</p>
              </div>
            )}
            {reductionPercentage > 0 && (
              <div className="glass px-5 py-3 rounded-xl border-green-200/50 flex flex-col items-end bg-green-50/20">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-700" />
                  <p className="text-[11px] font-black text-green-700 uppercase tracking-tight">Impact</p>
                </div>
                <p className="text-xl font-black text-green-700 leading-tight">-{reductionPercentage}% CO2e</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { 
            label: 'Nitrogen Load', 
            val: isComparison ? scenario.nitrogenExcreted : baseline.nitrogenExcreted, 
            unit: 'kg', 
            icon: Wind, 
            color: 'text-primary',
            border: '#3F704D',
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
            label: 'Carbon Equiv.', 
            val: isComparison ? scenario.totalCarbonEquivalent : baseline.totalCarbonEquivalent, 
            unit: 'kg CO2e', 
            icon: Leaf, 
            color: 'text-green-700',
            border: '#15803d',
            diff: isComparison ? baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent : 0
          }
        ].map((item, idx) => (
          <Card key={idx} className="glass overflow-hidden border-none shadow-sm transition-transform hover:scale-[1.02] duration-300">
            <div className="h-2 w-full" style={{ backgroundColor: item.border }} />
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                  <h3 className={cn("text-3xl font-black", item.color)}>
                    {item.unit === 'kg CO2e' ? formatCarbon(item.val) : formatValue(item.val)} 
                    <span className="text-xs font-bold ml-2 opacity-60">{item.unit}</span>
                  </h3>
                  {isComparison && item.diff > 0 && (
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                      <TrendingDown className="w-4 h-4" />
                      {item.unit === 'kg CO2e' ? formatCarbon(item.diff) : formatValue(item.diff)} {item.unit} Mitigated
                    </p>
                  )}
                </div>
                <div className="p-2.5 bg-primary/5 rounded-xl">
                  <item.icon className={cn("w-6 h-6 opacity-40", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Nitrogen Excretion (kg N)', data: nitrogenData, icon: Wind, color: 'text-primary' },
          { label: 'Phosphorus Excretion (kg P)', data: phosphorusData, icon: Droplets, color: 'text-secondary' },
          { label: 'Carbon Equivalent (kg CO2e)', data: carbonData, icon: Leaf, color: 'text-green-700' }
        ].map((chart, idx) => (
          <Card key={idx} className="glass rounded-2xl border-white/30 p-5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-[13px] font-black flex items-center gap-2.5 uppercase tracking-widest text-primary/80">
                <chart.icon className={cn("w-5 h-5", chart.color)} /> {chart.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] px-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.08)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 'bold', fill: 'hsl(var(--primary))' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
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

      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground italic font-medium">
          <Leaf className="w-4 h-4 opacity-50" />
          Note: Values derived from batch-specific mass balance and IPCC 2019 guidelines.
        </div>
        <Button 
          variant="outline" 
          className="glass h-12 px-8 rounded-xl font-black text-sm text-primary border-primary/20 flex items-center gap-2.5 uppercase tracking-widest transition-all hover:bg-primary hover:text-white shadow-sm" 
          onClick={() => window.print()}
        >
          <Download className="w-5 h-5" /> Export Cycle Audit
        </Button>
      </div>
    </div>
  );
}
