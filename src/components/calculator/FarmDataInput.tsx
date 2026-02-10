"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FarmData, AnimalType } from '@/lib/calculations';
import { Bird, Tractor, Settings2, Database, Repeat } from 'lucide-react';

interface Props {
  onCalculate: (data: FarmData) => void;
}

export function FarmDataInput({ onCalculate }: Props) {
  const [formData, setFormData] = useState<FarmData>({
    animalType: 'broilers',
    count: 1000,
    fcr: 1.6,
    cyclesPerYear: 6.5,
    feedCrudeProtein: 18,
    feedPhosphorus: 0.6,
    manureManagement: 'solid',
    avgWeight: 2.5,
    additive: 'none'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const updateField = (field: keyof FarmData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && !isNaN(Number(value)) && field !== 'animalType' && field !== 'manureManagement' && field !== 'additive' ? Number(value) : value
    }));
  };

  return (
    <Card className="shadow-2xl border-none">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          <CardTitle>Baseline Configuration</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          Enter your current farm parameters using Feed Conversion Ratio (FCR).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Bird className="w-4 h-4" /> Animal Species
              </Label>
              <Select 
                value={formData.animalType} 
                onValueChange={(val: AnimalType) => {
                  updateField('animalType', val);
                  if (val === 'swine') {
                    setFormData(prev => ({ ...prev, avgWeight: 110, fcr: 2.8, cyclesPerYear: 2.5 }));
                  } else {
                    setFormData(prev => ({ ...prev, avgWeight: 2.5, fcr: 1.6, cyclesPerYear: 6.5 }));
                  }
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broilers">Broilers (Poultry)</SelectItem>
                  <SelectItem value="swine">Swine (Pigs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="font-bold">Animals per Cycle</Label>
              <Input 
                className="h-12"
                type="number" 
                value={formData.count} 
                onChange={(e) => updateField('count', e.target.value)} 
                min="1"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-secondary">Target Market Weight (kg)</Label>
              <Input 
                className="h-12 border-secondary/20"
                type="number" 
                step="0.1"
                value={formData.avgWeight} 
                onChange={(e) => updateField('avgWeight', e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-secondary">Feed Conversion Ratio (FCR)</Label>
              <Input 
                className="h-12 border-secondary/20"
                type="number" 
                step="0.01"
                value={formData.fcr} 
                onChange={(e) => updateField('fcr', e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-1 font-bold text-primary/80">
                <Repeat className="w-4 h-4" /> Cycles per Year
              </Label>
              <Input 
                className="h-12"
                type="number" 
                step="0.1"
                value={formData.cyclesPerYear} 
                onChange={(e) => updateField('cyclesPerYear', e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-primary/80">Feed Crude Protein (%)</Label>
              <Input 
                className="h-12"
                type="number" 
                step="0.1"
                value={formData.feedCrudeProtein} 
                onChange={(e) => updateField('feedCrudeProtein', e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-primary/80">Feed Phosphorus (%)</Label>
              <Input 
                className="h-12"
                type="number" 
                step="0.01"
                value={formData.feedPhosphorus} 
                onChange={(e) => updateField('feedPhosphorus', e.target.value)} 
              />
            </div>

            <div className="space-y-3 md:col-span-1">
              <Label className="flex items-center gap-1 font-bold"><Tractor className="w-4 h-4" /> Manure Management</Label>
              <Select 
                value={formData.manureManagement} 
                onValueChange={(val) => updateField('manureManagement', val)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select practice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Storage / Litter</SelectItem>
                  <SelectItem value="lagoon">Anaerobic Lagoon</SelectItem>
                  <SelectItem value="slurry">Liquid/Slurry Storage</SelectItem>
                  <SelectItem value="dry-lot">Dry Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 text-xl shadow-lg">
            Establish Baseline Results
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}