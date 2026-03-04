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
    <Card className="glass border-white/40 overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-xl">
      <CardHeader className="bg-primary/90 backdrop-blur-md text-white p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg border border-white/30 backdrop-blur-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight uppercase">Farm Configuration</CardTitle>
            <CardDescription className="text-white/80 text-xs font-medium">Define production parameters to build an environmental profile.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
                <Bird className="w-3 h-3" /> Animal Category
              </Label>
              <Select 
                value={formData.animalType} 
                onValueChange={(val: AnimalType) => handleAnimalTypeChange(val)}
              >
                <SelectTrigger className="h-11 border-white/40 bg-white/40 backdrop-blur-md focus:ring-primary rounded-xl text-sm font-medium">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="broilers">Poultry: Broilers</SelectItem>
                  <SelectItem value="swine-sow">Swine: Sow & Litter</SelectItem>
                  <SelectItem value="swine-nursery">Swine: Nursery Pigs</SelectItem>
                  <SelectItem value="swine-grow-finish">Swine: Grow-to-Finish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-wider text-primary">Head Count per Cycle</Label>
              <Input 
                className="h-11 border-white/40 bg-white/40 backdrop-blur-md text-sm font-bold rounded-xl"
                type="number" 
                value={formData.count} 
                onChange={(e) => updateField('count', e.target.value)} 
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-wider text-secondary">Target Exit Weight (kg)</Label>
              <Input 
                className="h-11 border-secondary/20 bg-white/40 backdrop-blur-md text-sm font-bold rounded-xl"
                type="number" 
                step="0.1"
                value={formData.avgWeight} 
                onChange={(e) => updateField('avgWeight', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-wider text-secondary">Feed Conversion Ratio (FCR)</Label>
              <Input 
                className="h-11 border-secondary/20 bg-white/40 backdrop-blur-md text-sm font-bold rounded-xl"
                type="number" 
                step="0.01"
                value={formData.fcr} 
                onChange={(e) => updateField('fcr', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-primary">
                <Repeat className="w-3 h-3" /> Production Cycles
              </Label>
              <Input 
                className="h-11 border-white/40 bg-white/40 backdrop-blur-md text-sm font-bold rounded-xl"
                type="number" 
                step="0.1"
                value={formData.cyclesPerYear} 
                onChange={(e) => updateField('cyclesPerYear', e.target.value)} 
              />
              <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">Set to 1 for batch analysis.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-primary">
                <Waves className="w-3 h-3" /> Manure Management
              </Label>
              <Select 
                value={formData.manureManagement} 
                onValueChange={(val) => updateField('manureManagement', val)}
              >
                <SelectTrigger className="h-11 border-white/40 bg-white/40 backdrop-blur-md rounded-xl text-sm font-medium">
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="solid">Solid Storage / Litter</SelectItem>
                  <SelectItem value="lagoon">Anaerobic Lagoon</SelectItem>
                  <SelectItem value="slurry">Liquid/Slurry Storage</SelectItem>
                  <SelectItem value="dry-lot">Dry Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPhased ? (
              <div className="md:col-span-2 space-y-4 animate-in slide-in-from-top-4 duration-500">
                <div className="p-5 bg-white/30 rounded-2xl border border-white/50 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Dietary Nutrient Strategy (%)</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { id: 'phase1CP', label: 'Phase I CP (%)', value: formData.phase1CP },
                      { id: 'phase2CP', label: 'Phase II CP (%)', value: formData.phase2CP },
                      { id: 'phase3CP', label: 'Phase III CP (%)', value: formData.phase3CP },
                      { id: 'phase1P', label: 'Phase I P (%)', value: formData.phase1P },
                      { id: 'phase2P', label: 'Phase II P (%)', value: formData.phase2P },
                      { id: 'phase3P', label: 'Phase III P (%)', value: formData.phase3P },
                    ].map((item) => (
                      <div key={item.id} className="space-y-1.5">
                        <Label className="text-[9px] font-bold text-primary/70 uppercase tracking-wider">{item.label}</Label>
                        <Input 
                          type="number" 
                          step={item.id.includes('CP') ? "0.1" : "0.01"}
                          value={item.value} 
                          onChange={(e) => updateField(item.id as any, e.target.value)} 
                          className="h-10 border-white/50 bg-white/50 rounded-lg font-bold text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-primary">Dietary Crude Protein (%)</Label>
                  <Input 
                    className="h-11 border-white/40 bg-white/40 backdrop-blur-md text-sm font-bold rounded-xl"
                    type="number" 
                    step="0.1"
                    value={formData.feedCrudeProtein} 
                    onChange={(e) => updateField('feedCrudeProtein', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-primary">Dietary Phosphorus (%)</Label>
                  <Input 
                    className="h-11 border-white/40 bg-white/40 backdrop-blur-md text-sm font-bold rounded-xl"
                    type="number" 
                    step="0.01"
                    value={formData.feedPhosphorus} 
                    onChange={(e) => updateField('feedPhosphorus', e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest">
            Generate Environmental Baseline
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
