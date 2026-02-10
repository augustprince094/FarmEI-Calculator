
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmissionResults } from '@/lib/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { Wind, Droplets, Leaf, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  results: EmissionResults;
}

export function EmissionsResults({ results }: Props) {
  const barData = [
    { name: 'N Excreted', value: Math.round(results.nitrogenExcreted), unit: 'kg/yr' },
    { name: 'P Excreted', value: Math.round(results.phosphorusExcreted), unit: 'kg/yr' },
    { name: 'P Runoff', value: Math.round(results.phosphorusRunoff), unit: 'kg/yr' },
  ];

  const gasData = [
    { name: 'Enteric CH4', value: Math.round(results.entericMethane) },
    { name: 'Manure CH4', value: Math.round(results.manureMethane) },
    { name: 'Direct N2O', value: Math.round(results.directN2O) },
    { name: 'Indirect N2O', value: Math.round(results.indirectN2O) },
  ];

  const COLORS = ['#3F704D', '#A0522D', '#2E8B57', '#8B4513'];

  const formatValue = (val: number) => val.toLocaleString();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nitrogen Excreted</p>
                <h3 className="text-2xl font-bold text-primary">{formatValue(Math.round(results.nitrogenExcreted))} <span className="text-sm font-normal">kg/yr</span></h3>
              </div>
              <Wind className="text-primary/40 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-secondary">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phosphorus Excreted</p>
                <h3 className="text-2xl font-bold text-secondary">{formatValue(Math.round(results.phosphorusExcreted))} <span className="text-sm font-normal">kg/yr</span></h3>
              </div>
              <Droplets className="text-secondary/40 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-green-700">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carbon Intensity</p>
                <h3 className="text-2xl font-bold text-green-700">{formatValue(Math.round(results.totalCarbonEquivalent))} <span className="text-sm font-normal">kg CO₂e/yr</span></h3>
              </div>
              <Leaf className="text-green-700/40 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Excretion & Runoff Profile (kg/yr)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip cursor={{ fill: '#F5F5DC' }} />
                <Bar dataKey="value" fill="#3F704D" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3F704D' : '#A0522D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gas Emission Source Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gasData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Download Full Report
        </Button>
      </div>
    </div>
  );
}
