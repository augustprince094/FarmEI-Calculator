
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FarmData, AnimalType } from '@/lib/calculations';
import { Beef, Bird, Tractor, Settings2 } from 'lucide-react';

interface Props {
  onCalculate: (data: FarmData) => void;
}

export function FarmDataInput({ onCalculate }: Props) {
  const [formData, setFormData] = useState<FarmData>({
    animalType: 'broilers',
    count: 1000,
    feedConsumption: 0.15,
    feedCrudeProtein: 18,
    feedPhosphorus: 0.6,
    manureManagement: 'solid',
    avgWeight: 2.5
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const updateField = (field: keyof FarmData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value
    }));
  };

  return (
    <Card className="shadow-xl border-none">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          <CardTitle>Farm Configuration</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          Enter your farm specific data to begin the emission intensity estimation.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Bird className="w-4 h-4" /> Animal Species</Label>
              <Select 
                value={formData.animalType} 
                onValueChange={(val: AnimalType) => {
                  updateField('animalType', val);
                  if (val === 'swine') {
                    setFormData(prev => ({ ...prev, avgWeight: 75, feedConsumption: 2.5 }));
                  } else {
                    setFormData(prev => ({ ...prev, avgWeight: 2.5, feedConsumption: 0.15 }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broilers">Broilers (Poultry)</SelectItem>
                  <SelectItem value="swine">Swine (Pigs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Animals</Label>
              <Input 
                type="number" 
                value={formData.count} 
                onChange={(e) => updateField('count', e.target.value)} 
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Avg. Animal Weight (kg)</Label>
              <Input 
                type="number" 
                step="0.1"
                value={formData.avgWeight} 
                onChange={(e) => updateField('avgWeight', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Daily Feed / Animal (kg)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.feedConsumption} 
                onChange={(e) => updateField('feedConsumption', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Feed Crude Protein (%)</Label>
              <Input 
                type="number" 
                step="0.1"
                value={formData.feedCrudeProtein} 
                onChange={(e) => updateField('feedCrudeProtein', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Feed Phosphorus (%)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.feedPhosphorus} 
                onChange={(e) => updateField('feedPhosphorus', e.target.value)} 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1"><Tractor className="w-4 h-4" /> Manure Management Practice</Label>
              <Select 
                value={formData.manureManagement} 
                onValueChange={(val) => updateField('manureManagement', val)}
              >
                <SelectTrigger>
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

          <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold h-12 text-lg">
            Calculate Emission Intensities
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
