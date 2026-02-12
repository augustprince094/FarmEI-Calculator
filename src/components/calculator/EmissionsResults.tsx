"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparativeResults } from '@/lib/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell
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

  const additiveName = additiveType === 'jefo-pro' ? 'Jefo Pro Solution' : additiveType === 'poa-eo' ? 'P(OA+EO)' : 'None';

  const formatValue = (val: number) => val.toLocaleString();

  const reductionPercentage = baseline.totalCarbonEquivalent > 0 
    ? Math.round(((baseline.totalCarbonEquivalent - scenario.totalCarbonEquivalent) / baseline.totalCarbonEquivalent) * 100)
    : 0;

  const fcrImprovement = (baselineFcr && scenarioFcr && baselineFcr > 0)
    ? Math.round(((baselineFcr - scenarioFcr) / baselineFcr) * 100)
    : 0;

  // Data for individual charts
  const nitrogenData = [
    { name: 'Baseline', value: Math.round(baseline.nitrogenExcreted), fill: '#A0522D' },
    { name: additiveName, value: Math.round(scenario.nitrogenExcreted), fill: '#3F704D' }
  ];

  const phosphorusData = [
    { name: 'Baseline', value: Math.round(baseline.phosphorusExcreted), fill: '#A0522D' },
    { name: additiveName, value: Math.round(scenario.phosphorusExcreted), fill: '#3F704D' }
  ];

  const carbonData = [
    { name: 'Baseline', value: Math.round(baseline.totalCarbonEquivalent), fill: '#A0522D' },
    { name: additiveName, value: Math.round(scenario.totalCarbonEquivalent), fill: '#3F704D' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-bold text-xs mb-1">{label}</p>
          <p className="text-sm font-black text-primary">
            {payload[0].value.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground uppercase">{payload[0].unit || ''}</span>
          </p>
        </div>
      );
    }
    return null;
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nitrogen Chart */}
        <Card className="shadow-lg border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wind className="w-4 h-4 text-primary" /> Nitrogen (kg N/yr)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nitrogenData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {nitrogenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Phosphorus Chart */}
        <Card className="shadow-lg border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Droplets className="w-4 h-4 text-secondary" /> Phosphorus (kg P/yr)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phosphorusData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {phosphorusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Carbon Chart */}
        <Card className="shadow-lg border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-700" /> Carbon (kg CO₂e/yr)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carbonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {carbonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-between items-center">
        <p className="text-xs text-muted-foreground italic">
          *Scales are normalized per metric to visualize relative efficiency gains. Carbon values include enteric and manure CH4 + N2O.
        </p>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Export Technical Report
        </Button>
      </div>
    </div>
  );
}
