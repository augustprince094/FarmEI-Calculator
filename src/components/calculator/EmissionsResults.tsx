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
    { name: 'Base', value: Number(baseline.nitrogenExcreted.toFixed(1)), fill: baselineColor, unit: 'kg' },
    { name: 'Scen', value: Number(scenario.nitrogenExcreted.toFixed(1)), fill: scenarioColor, unit: 'kg' }
  ];

  const phosphorusData = [
    { name: 'Base', value: Number(baseline.phosphorusExcreted.toFixed(1)), fill: baselineColor, unit: 'kg' },
    { name: 'Scen', value: Number(scenario.phosphorusExcreted.toFixed(1)), fill: scenarioColor, unit: 'kg' }
  ];

  const carbonData = [
    { name: 'Base', value: Math.round(baseline.totalCarbonEquivalent), fill: baselineColor, unit: 'kg CO2e' },
    { name: 'Scen', value: Math.round(scenario.totalCarbonEquivalent), fill: scenarioColor, unit: 'kg CO2e' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-2 rounded-lg border-white/40 shadow-2xl">
          <p className="font-bold text-[9px] mb-0.5 text-primary uppercase tracking-wider">{label}</p>
          <p className="text-xs font-black text-primary">
            {payload[0].value.toLocaleString()} <span className="text-[8px] font-medium text-muted-foreground uppercase">{payload[0].payload.unit || ''}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/50 shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-primary tracking-tight uppercase">
            {isComparison ? 'Performance' : 'Impact Profile'}
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
            {isComparison ? (
              <span style={{ color: scenarioColor }}>{additiveName} Mitigation Strategy</span>
            ) : (
              'Cycle Benchmarks'
            )}
          </p>
        </div>
        {isComparison && (
          <div className="flex items-center gap-3">
            {fcrImprovement > 0 && (
              <div className="glass px-3 py-1.5 rounded-xl border-secondary/20 flex items-center gap-2">
                 <Calculator className="w-3 h-3 text-secondary" />
                 <p className="text-xs font-black text-secondary">-{fcrImprovement}% FCR</p>
              </div>
            )}
            {reductionPercentage > 0 && (
              <div className="glass px-3 py-1.5 rounded-xl border-green-200/50 flex items-center gap-2 bg-green-50/40">
                <TrendingDown className="w-4 h-4 text-green-700" />
                <p className="text-sm font-black text-green-700">-{reductionPercentage}% CO2e</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            label: 'Carbon Equiv.', 
            val: isComparison ? scenario.totalCarbonEquivalent : baseline.totalCarbonEquivalent, 
            unit: 'kg CO2e', 
            icon: Leaf, 
            color: 'text-green-700',
            border: '#15803d',
            diff: isComparison ? baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent : 0
          }
        ].map((item, idx) => (
          <Card key={idx} className="glass overflow-hidden border-none shadow-sm">
            <div className="h-1 w-full" style={{ backgroundColor: item.border }} />
            <CardContent className="p-3.5">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                  <h3 className={cn("text-xl font-black", item.color)}>
                    {item.unit === 'kg CO2e' ? formatCarbon(item.val) : formatValue(item.val)} 
                    <span className="text-[9px] font-bold ml-1 opacity-60">{item.unit}</span>
                  </h3>
                  {isComparison && item.diff > 0 && (
                    <p className="text-[8px] text-green-700 font-black uppercase tracking-wider">
                      -{item.unit === 'kg CO2e' ? formatCarbon(item.diff) : formatValue(item.diff)} Mitigated
                    </p>
                  )}
                </div>
                <div className="p-1.5 bg-primary/5 rounded-lg">
                  <item.icon className={cn("w-4 h-4 opacity-40", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Nitrogen (kg N)', data: nitrogenData, icon: Wind, color: 'text-primary' },
          { label: 'Phosphorus (kg P)', data: phosphorusData, icon: Droplets, color: 'text-secondary' },
          { label: 'Carbon (kg CO2e)', data: carbonData, icon: Leaf, color: 'text-green-700' }
        ].map((chart, idx) => (
          <Card key={idx} className="glass rounded-xl border-white/30 p-2.5">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-[8px] font-black flex items-center gap-1.5 uppercase tracking-widest text-primary/80">
                <chart.icon className={cn("w-3 h-3", chart.color)} /> {chart.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[120px] px-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={18}>
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

      <div className="flex justify-between items-center pt-2">
        <p className="text-[9px] text-muted-foreground italic font-medium">
          Note: Intensities are batch-specific derived from mass balance logic.
        </p>
        <Button variant="outline" className="glass h-8 px-4 rounded-lg font-black text-[10px] text-primary border-primary/20 flex items-center gap-1.5 uppercase tracking-widest" onClick={() => window.print()}>
          <Download className="w-3 h-3" /> Cycle Audit
        </Button>
      </div>
    </div>
  );
}
