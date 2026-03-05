"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FarmData, AnimalType } from '@/lib/calculations';
import { Bird, Database, Repeat, Waves, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        defaults = { 
          ...defaults, 
          avgWeight: 250, 
          fcr: 3.5, 
          cyclesPerYear: 1, 
          count: 100, 
          phase1CP: 13, 
          phase2CP: 18, 
          phase3CP: 0,
          phase1P: 0.5,
          phase2P: 0.65,
          phase3P: 0,
          manureManagement: 'slurry' 
        };
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

  const isPhased = formData.animalType === 'broilers' || 
                   formData.animalType === 'swine-nursery' || 
                   formData.animalType === 'swine-sow';

  return (
    <Card className="glass border-white/40 overflow-hidden rounded-2xl">
      <CardHeader className="bg-primary/90 backdrop-blur-md text-white p-5">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-lg border border-white/30 backdrop-blur-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight uppercase">Configuration</CardTitle>
            <CardDescription className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Define Cycle Parameters</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                <Bird className="w-3.5 h-3.5" /> Category
              </Label>
              <Select 
                value={formData.animalType} 
                onValueChange={(val: AnimalType) => handleAnimalTypeChange(val)}
              >
                <SelectTrigger className="h-11 border-white/40 bg-white/60 backdrop-blur-md focus:ring-primary rounded-xl text-sm font-bold">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="broilers" className="text-sm">Poultry: Broilers</SelectItem>
                  <SelectItem value="swine-sow" className="text-sm">Swine: Sow & Litter</SelectItem>
                  <SelectItem value="swine-nursery" className="text-sm">Swine: Nursery Pigs</SelectItem>
                  <SelectItem value="swine-grow-finish" className="text-sm">Swine: Grow-to-Finish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[11px] uppercase tracking-wider text-primary">Head Count</Label>
              <Input 
                className="h-11 border-white/60 bg-white/70 text-sm font-bold rounded-xl"
                type="number" 
                value={formData.count} 
                onChange={(e) => updateField('count', e.target.value)} 
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[11px] uppercase tracking-wider text-secondary">Exit Weight (kg)</Label>
              <Input 
                className="h-11 border-secondary/30 bg-white/70 text-sm font-bold rounded-xl"
                type="number" 
                step="0.1"
                value={formData.avgWeight} 
                onChange={(e) => updateField('avgWeight', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[11px] uppercase tracking-wider text-secondary">Baseline FCR</Label>
              <Input 
                className="h-11 border-secondary/30 bg-white/70 text-sm font-bold rounded-xl"
                type="number" 
                step="0.01"
                value={formData.fcr} 
                onChange={(e) => updateField('fcr', e.target.value)} 
              />
            </div>

            {isPhased ? (
              <div className="md:col-span-2 space-y-4 pt-2 animate-in slide-in-from-top-4 duration-500">
                <div className="p-4 bg-white/40 rounded-xl border border-primary/10 shadow-sm backdrop-blur-lg">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">
                      {formData.animalType === 'swine-sow' ? 'Sow Cycle Nutrients (%)' : 'Dietary Strategy (%)'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'phase1CP', label: formData.animalType === 'swine-sow' ? 'Gest CP' : 'P1 CP', value: formData.phase1CP },
                      { id: 'phase2CP', label: formData.animalType === 'swine-sow' ? 'Lact CP' : 'P2 CP', value: formData.phase2CP },
                      { id: 'phase3CP', label: 'P3 CP', value: formData.phase3CP, hidden: formData.animalType === 'swine-sow' },
                      { id: 'phase1P', label: formData.animalType === 'swine-sow' ? 'Gest P' : 'P1 P', value: formData.phase1P },
                      { id: 'phase2P', label: formData.animalType === 'swine-sow' ? 'Lact P' : 'P2 P', value: formData.phase2P },
                      { id: 'phase3P', label: 'P3 P', value: formData.phase3P, hidden: formData.animalType === 'swine-sow' },
                    ].filter(i => !i.hidden).map((item) => (
                      <div key={item.id} className="space-y-1.5">
                        <Label className="text-[10px] font-black text-primary uppercase tracking-tight">{item.label}</Label>
                        <Input 
                          type="number" 
                          step={item.id.includes('CP') ? "0.1" : "0.01"}
                          value={item.value} 
                          onChange={(e) => updateField(item.id as any, e.target.value)} 
                          className="h-9 border-primary/20 bg-white/90 rounded-lg font-bold text-xs px-2.5 text-primary focus:ring-primary shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="font-bold text-[11px] uppercase tracking-wider text-primary">Crude Protein (%)</Label>
                  <Input 
                    className="h-11 border-white/60 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    step="0.1"
                    value={formData.feedCrudeProtein} 
                    onChange={(e) => updateField('feedCrudeProtein', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[11px] uppercase tracking-wider text-primary">Phosphorus (%)</Label>
                  <Input 
                    className="h-11 border-white/60 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    step="0.01"
                    value={formData.feedPhosphorus} 
                    onChange={(e) => updateField('feedPhosphorus', e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 text-base rounded-xl shadow-md transition-all uppercase tracking-widest mt-4">
            Establish Baseline
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}