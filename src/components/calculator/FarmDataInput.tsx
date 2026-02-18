"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FarmData, AnimalType } from '@/lib/calculations';
import { Bird, Database, Repeat, Waves } from 'lucide-react';

interface Props {
  onCalculate: (data: FarmData) => void;
}

export function FarmDataInput({ onCalculate }: Props) {
  const [formData, setFormData] = useState<FarmData>({
    animalType: 'broilers',
    count: 1000,
    fcr: 1.6,
    cyclesPerYear: 1,
    feedCrudeProtein: 18,
    phase1CP: 22,
    phase2CP: 20,
    phase3CP: 18.5,
    feedPhosphorus: 0.6,
    phase1P: 0.65,
    phase2P: 0.6,
    phase3P: 0.55,
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
      [field]: typeof value === 'string' && !isNaN(Number(value)) && !['animalType', 'manureManagement', 'additive'].includes(field) ? Number(value) : value
    }));
  };

  const handleAnimalTypeChange = (val: AnimalType) => {
    let defaults: Partial<FarmData> = { animalType: val };
    
    switch (val) {
      case 'swine-sow':
        defaults = { ...defaults, avgWeight: 250, fcr: 3.5, cyclesPerYear: 1, count: 100, feedCrudeProtein: 14, feedPhosphorus: 0.55, manureManagement: 'slurry' };
        break;
      case 'swine-nursery':
        defaults = { 
          ...defaults, 
          avgWeight: 25, 
          fcr: 1.5, 
          cyclesPerYear: 1, 
          count: 1000, 
          phase1CP: 22, 
          phase2CP: 20, 
          phase3CP: 18,
          phase1P: 0.75,
          phase2P: 0.65,
          phase3P: 0.6,
          manureManagement: 'slurry' 
        };
        break;
      case 'swine-grow-finish':
        defaults = { ...defaults, avgWeight: 115, fcr: 2.8, cyclesPerYear: 1, count: 1000, feedCrudeProtein: 16, feedPhosphorus: 0.5, manureManagement: 'slurry' };
        break;
      case 'broilers':
      default:
        defaults = { 
          ...defaults, 
          avgWeight: 2.5, 
          fcr: 1.6, 
          cyclesPerYear: 1, 
          count: 1000, 
          phase1CP: 22, 
          phase2CP: 20, 
          phase3CP: 18.5,
          phase1P: 0.65,
          phase2P: 0.6,
          phase3P: 0.55,
          manureManagement: 'solid' 
        };
        break;
    }
    
    setFormData(prev => ({ ...prev, ...defaults }));
  };

  const isPhased = formData.animalType === 'broilers' || formData.animalType === 'swine-nursery';

  return (
    <Card className="shadow-2xl border-none overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          <CardTitle>Farm Baseline Setup</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          Define current production metrics to establish environmental benchmarks.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Bird className="w-4 h-4" /> Animal Production Type
              </Label>
              <Select 
                value={formData.animalType} 
                onValueChange={(val: AnimalType) => handleAnimalTypeChange(val)}
              >
                <SelectTrigger className="h-12 border-primary/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broilers">Poultry: Broilers</SelectItem>
                  <SelectItem value="swine-sow">Swine: Sow and Litter</SelectItem>
                  <SelectItem value="swine-nursery">Swine: Nursery Pigs</SelectItem>
                  <SelectItem value="swine-grow-finish">Swine: Grow-to-Finish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="font-bold">Animals per Cycle (Count)</Label>
              <Input 
                className="h-12"
                type="number" 
                value={formData.count} 
                onChange={(e) => updateField('count', e.target.value)} 
                min="1"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-secondary">Final Weight at Exit (kg)</Label>
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
                <Repeat className="w-4 h-4" /> Production Cycles
              </Label>
              <Input 
                className="h-12"
                type="number" 
                step="0.1"
                value={formData.cyclesPerYear} 
                onChange={(e) => updateField('cyclesPerYear', e.target.value)} 
              />
              <p className="text-[10px] text-muted-foreground italic">Set to 1 for a single batch analysis.</p>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-1 font-bold">
                <Waves className="w-4 h-4" /> Manure System
              </Label>
              <Select 
                value={formData.manureManagement} 
                onValueChange={(val) => updateField('manureManagement', val)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Storage / Litter</SelectItem>
                  <SelectItem value="lagoon">Anaerobic Lagoon</SelectItem>
                  <SelectItem value="slurry">Liquid/Slurry Storage</SelectItem>
                  <SelectItem value="dry-lot">Dry Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPhased ? (
              <div className="md:col-span-2 space-y-6">
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="text-sm font-bold text-primary mb-4">Phase Specific Nutrients (%)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">Phase I CP (%)</Label>
                      <Input 
                        type="number" step="0.1" value={formData.phase1CP} 
                        onChange={(e) => updateField('phase1CP', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">Phase II CP (%)</Label>
                      <Input 
                        type="number" step="0.1" value={formData.phase2CP} 
                        onChange={(e) => updateField('phase2CP', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">Phase III CP (%)</Label>
                      <Input 
                        type="number" step="0.1" value={formData.phase3CP} 
                        onChange={(e) => updateField('phase3CP', e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">Phase I P (%)</Label>
                      <Input 
                        type="number" step="0.01" value={formData.phase1P} 
                        onChange={(e) => updateField('phase1P', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">Phase II P (%)</Label>
                      <Input 
                        type="number" step="0.01" value={formData.phase2P} 
                        onChange={(e) => updateField('phase2P', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">Phase III P (%)</Label>
                      <Input 
                        type="number" step="0.01" value={formData.phase3P} 
                        onChange={(e) => updateField('phase3P', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="font-bold text-primary/80">Diet Crude Protein (%)</Label>
                  <Input 
                    className="h-12"
                    type="number" 
                    step="0.1"
                    value={formData.feedCrudeProtein} 
                    onChange={(e) => updateField('feedCrudeProtein', e.target.value)} 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-bold text-primary/80">Diet Phosphorus (%)</Label>
                  <Input 
                    className="h-12"
                    type="number" 
                    step="0.01"
                    value={formData.feedPhosphorus} 
                    onChange={(e) => updateField('feedPhosphorus', e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 text-xl shadow-lg transition-all active:scale-[0.98]">
            Establish Environmental Baseline
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
