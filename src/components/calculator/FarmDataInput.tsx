"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FarmData, AnimalType, Region, AWMS } from '@/lib/calculations';
import { Bird, Database, Globe, Trash2, Microscope, Clock, FlaskConical, Beaker, Zap } from 'lucide-react';

interface Props {
  onCalculate: (data: FarmData) => void;
}

export function FarmDataInput({ onCalculate }: Props) {
  const [formData, setFormData] = useState<FarmData>({
    animalType: 'broilers',
    region: 'North America',
    awms: 'poultry-litter',
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
    additive: 'none',
    nitrogenDigestibility: 0.85,
    useExperimentalData: false,
    useExperimentalN: false,
    useExperimentalP: false,
    fecalN: 4.5,
    fecalP: 1.2,
    cycleDurationDays: 42
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const updateField = (field: keyof FarmData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: (typeof value === 'string' && !isNaN(Number(value)) && !['animalType', 'manureManagement', 'additive', 'region', 'awms'].includes(field)) ? Number(value) : value
    }));
  };

  const handleAnimalTypeChange = (val: AnimalType) => {
    let defaults: Partial<FarmData> = { animalType: val, region: 'North America' };
    
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
          manureManagement: 'slurry',
          cycleDurationDays: 365
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
          manureManagement: 'slurry',
          cycleDurationDays: 49
        };
        break;
      case 'swine-grow-finish':
        defaults = { ...defaults, avgWeight: 115, fcr: 2.8, cyclesPerYear: 1, count: 1000, feedCrudeProtein: 16, feedPhosphorus: 0.5, manureManagement: 'slurry', cycleDurationDays: 115 };
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
          manureManagement: 'solid',
          awms: 'poultry-litter',
          cycleDurationDays: 42
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
                  <SelectItem value="broilers">Poultry: Broilers</SelectItem>
                  <SelectItem value="swine-sow">Swine: Sow & Litter</SelectItem>
                  <SelectItem value="swine-nursery">Swine: Nursery Pigs</SelectItem>
                  <SelectItem value="swine-grow-finish">Swine: Grow-to-Finish</SelectItem>
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
              <Label className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" /> Region of Interest
              </Label>
              <Select 
                value={formData.region} 
                onValueChange={(val: Region) => updateField('region', val)}
              >
                <SelectTrigger className="h-11 border-white/40 bg-white/60 backdrop-blur-md focus:ring-primary rounded-xl text-sm font-bold">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="Western Europe">Western Europe</SelectItem>
                  <SelectItem value="Eastern Europe">Eastern Europe</SelectItem>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="Latin America">Latin America</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                <Trash2 className="w-3.5 h-3.5" /> Waste Management (AWMS)
              </Label>
              <Select 
                value={formData.animalType === 'broilers' ? formData.awms : formData.manureManagement} 
                onValueChange={(val: any) => updateField(formData.animalType === 'broilers' ? 'awms' : 'manureManagement', val)}
              >
                <SelectTrigger className="h-11 border-white/40 bg-white/60 backdrop-blur-md focus:ring-primary rounded-xl text-sm font-bold">
                  <SelectValue placeholder="Select AWMS" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="lagoon">Lagoon</SelectItem>
                  <SelectItem value="liquid-slurry">Liquid/Slurry</SelectItem>
                  <SelectItem value="poultry-litter">Poultry with litter</SelectItem>
                  <SelectItem value="solid-storage">Solid storage</SelectItem>
                  <SelectItem value="pit-long-term">Pit {'>'} 1 month</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Nitrogen / Protein Digestibility
              </Label>
              <Input 
                className="h-11 border-primary/30 bg-white/70 text-sm font-bold rounded-xl"
                type="number" 
                step="0.01"
                placeholder="Default 0.85"
                value={formData.nitrogenDigestibility} 
                onChange={(e) => updateField('nitrogenDigestibility', e.target.value)} 
              />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Value used for fecal dry matter output estimation in Nitrogen cycles.</p>
            </div>

            <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-xs font-black text-primary uppercase flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> Laboratory Experimental Mode
                </Label>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Override metabolic model with measured fecal data</p>
              </div>
              <Switch 
                checked={formData.useExperimentalData} 
                onCheckedChange={(val) => updateField('useExperimentalData', val)}
              />
            </div>

            {formData.useExperimentalData && (
              <div className="md:col-span-2 space-y-4 pt-2 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-secondary/20 shadow-sm">
                    <Label className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                      <Microscope className="w-3.5 h-3.5" /> Fecal N Analysis
                    </Label>
                    <Switch 
                      checked={formData.useExperimentalN} 
                      onCheckedChange={(val) => updateField('useExperimentalN', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-secondary/20 shadow-sm">
                    <Label className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                      <Microscope className="w-3.5 h-3.5" /> Fecal P Analysis
                    </Label>
                    <Switch 
                      checked={formData.useExperimentalP} 
                      onCheckedChange={(val) => updateField('useExperimentalP', val)}
                    />
                  </div>
                </div>

                <div className="p-4 bg-white/40 rounded-xl border border-secondary/10 flex items-center justify-between">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Cycle Duration
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={formData.cycleDurationDays} 
                      onChange={(e) => updateField('cycleDurationDays', e.target.value)}
                      className="h-9 w-20 border-secondary/20 font-black text-secondary text-center"
                    />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Days</span>
                  </div>
                </div>
              </div>
            )}

            {/* Nitrogen Strategy */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-4 h-4 text-primary" />
                <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Nitrogen Strategy</h4>
              </div>
              
              {formData.useExperimentalData && formData.useExperimentalN ? (
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 space-y-3 animate-in fade-in duration-300">
                  <Label className="text-[10px] font-black text-secondary uppercase tracking-widest">Measured Fecal Nitrogen (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.fecalN} 
                    onChange={(e) => updateField('fecalN', e.target.value)} 
                    className="h-11 font-black bg-white/70" 
                  />
                  <p className="text-[10px] text-muted-foreground italic font-medium">Applied to Daily Fecal DM = Daily Feed * (1 - Nitrogen Digestibility).</p>
                </div>
              ) : (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3 animate-in fade-in duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Dietary Crude Protein (%)</Label>
                  {isPhased ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Gest CP' : 'P1 CP'}</Label>
                        <Input type="number" step="0.1" value={formData.phase1CP} onChange={(e) => updateField('phase1CP', e.target.value)} className="h-9 font-black" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Lact CP' : 'P2 CP'}</Label>
                        <Input type="number" step="0.1" value={formData.phase2CP} onChange={(e) => updateField('phase2CP', e.target.value)} className="h-9 font-black" />
                      </div>
                      {formData.animalType !== 'swine-sow' && (
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">P3 CP</Label>
                          <Input type="number" step="0.1" value={formData.phase3CP} onChange={(e) => updateField('phase3CP', e.target.value)} className="h-9 font-black" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input type="number" step="0.1" value={formData.feedCrudeProtein} onChange={(e) => updateField('feedCrudeProtein', e.target.value)} className="h-11 font-black" />
                  )}
                </div>
              )}
            </div>

            {/* Phosphorus Strategy */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-4 h-4 text-primary" />
                <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Phosphorus Strategy</h4>
              </div>

              {formData.useExperimentalData && formData.useExperimentalP ? (
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 space-y-3 animate-in fade-in duration-300">
                  <Label className="text-[10px] font-black text-secondary uppercase tracking-widest">Measured Fecal Phosphorus (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.fecalP} 
                    onChange={(e) => updateField('fecalP', e.target.value)} 
                    className="h-11 font-black bg-white/70" 
                  />
                </div>
              ) : (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3 animate-in fade-in duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Dietary Phosphorus (%)</Label>
                  {isPhased ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Gest P' : 'P1 P'}</Label>
                        <Input type="number" step="0.01" value={formData.phase1P} onChange={(e) => updateField('phase1P', e.target.value)} className="h-9 font-black" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Lact P' : 'P2 P'}</Label>
                        <Input type="number" step="0.01" value={formData.phase2P} onChange={(e) => updateField('phase2P', e.target.value)} className="h-9 font-black" />
                      </div>
                      {formData.animalType !== 'swine-sow' && (
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">P3 P</Label>
                          <Input type="number" step="0.01" value={formData.phase3P} onChange={(e) => updateField('phase3P', e.target.value)} className="h-9 font-black" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input type="number" step="0.01" value={formData.feedPhosphorus} onChange={(e) => updateField('feedPhosphorus', e.target.value)} className="h-11 font-black" />
                  )}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 text-base rounded-xl shadow-md transition-all uppercase tracking-widest mt-4">
            Establish Baseline
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
