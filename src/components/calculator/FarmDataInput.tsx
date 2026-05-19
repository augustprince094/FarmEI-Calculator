
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FarmData, AnimalType, Region, AWMS } from '@/lib/calculations';
import { Bird, Database, Globe, Trash2, Microscope, Clock, FlaskConical, Beaker, Zap, Baby } from 'lucide-react';

interface Props {
  onCalculate: (data: FarmData) => void;
}

export function FarmDataInput({ onCalculate }: Props) {
  const [formData, setFormData] = useState<any>({
    animalType: 'broilers',
    region: 'North America',
    awms: 'poultry-litter',
    count: '',
    fcr: '',
    cyclesPerYear: 1,
    feedCrudeProtein: '',
    phase1CP: '',
    phase2CP: '',
    phase3CP: '',
    feedPhosphorus: '',
    phase1P: '',
    phase2P: '',
    phase3P: '',
    manureManagement: 'solid',
    avgWeight: '',
    additive: 'none',
    nitrogenDigestibility: '',
    useExperimentalData: false,
    useExperimentalN: false,
    useExperimentalP: false,
    fecalN: '',
    fecalP: '',
    cycleDurationDays: '',
    pigletsPerLitter: '',
    avgLitterWeight: '',
    gestationFeedIntake: '',
    lactationFeedIntake: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Provide scientific defaults if fields are left as empty placeholders
    const submittedData: FarmData = {
      ...formData,
      count: Number(formData.count) || 1000,
      fcr: Number(formData.fcr) || 1.6,
      feedCrudeProtein: Number(formData.feedCrudeProtein) || 18,
      phase1CP: Number(formData.phase1CP) || 22,
      phase2CP: Number(formData.phase2CP) || 20,
      phase3CP: Number(formData.phase3CP) || 18.5,
      feedPhosphorus: Number(formData.feedPhosphorus) || 0.6,
      phase1P: Number(formData.phase1P) || 0.65,
      phase2P: Number(formData.phase2P) || 0.6,
      phase3P: Number(formData.phase3P) || 0.55,
      avgWeight: Number(formData.avgWeight) || 2.5,
      nitrogenDigestibility: Number(formData.nitrogenDigestibility) || 0.85,
      fecalN: Number(formData.fecalN) || 4.5,
      fecalP: Number(formData.fecalP) || 1.2,
      cycleDurationDays: Number(formData.cycleDurationDays) || 42,
      pigletsPerLitter: Number(formData.pigletsPerLitter) || 12,
      avgLitterWeight: Number(formData.avgLitterWeight) || 1.5,
      gestationFeedIntake: Number(formData.gestationFeedIntake) || 300,
      lactationFeedIntake: Number(formData.lactationFeedIntake) || 150
    };
    
    onCalculate(submittedData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnimalTypeChange = (val: AnimalType) => {
    setFormData((prev: any) => ({
      ...prev,
      animalType: val,
      count: '',
      fcr: '',
      avgWeight: '',
      phase1CP: '',
      phase2CP: '',
      phase3CP: '',
      phase1P: '',
      phase2P: '',
      phase3P: '',
      pigletsPerLitter: '',
      avgLitterWeight: '',
      gestationFeedIntake: '',
      lactationFeedIntake: '',
      awms: val === 'broilers' ? 'poultry-litter' : 'liquid-slurry',
      manureManagement: val === 'broilers' ? 'solid' : 'slurry'
    }));
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
                placeholder="1000"
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
                  <SelectItem value="lagoon">Lagoon (67% MCF)</SelectItem>
                  <SelectItem value="liquid-slurry">Liquid/Slurry (16% MCF)</SelectItem>
                  <SelectItem value="poultry-litter">Poultry with litter (2% MCF)</SelectItem>
                  <SelectItem value="solid-storage">Solid storage (2% MCF)</SelectItem>
                  <SelectItem value="pit-long-term">Pit &gt; 1 month (16% MCF)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.animalType === 'swine-sow' ? (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider text-secondary">
                    <Baby className="w-3.5 h-3.5" /> Piglets per Litter
                  </Label>
                  <Input 
                    className="h-11 border-secondary/30 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    value={formData.pigletsPerLitter} 
                    placeholder="12"
                    onChange={(e) => updateField('pigletsPerLitter', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[11px] uppercase tracking-wider text-secondary">Average Piglet Weight (kg)</Label>
                  <Input 
                    className="h-11 border-secondary/30 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    step="0.1"
                    value={formData.avgLitterWeight} 
                    placeholder="1.5"
                    onChange={(e) => updateField('avgLitterWeight', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[11px] uppercase tracking-wider text-primary">Gestation Feed Consumption (kg)</Label>
                  <Input 
                    className="h-11 border-white/60 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    value={formData.gestationFeedIntake} 
                    placeholder="300"
                    onChange={(e) => updateField('gestationFeedIntake', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[11px] uppercase tracking-wider text-primary">Lactation Feed Consumption (kg)</Label>
                  <Input 
                    className="h-11 border-white/60 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    value={formData.lactationFeedIntake} 
                    placeholder="150"
                    onChange={(e) => updateField('lactationFeedIntake', e.target.value)} 
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-bold text-[11px] uppercase tracking-wider text-secondary">Exit Weight (kg)</Label>
                  <Input 
                    className="h-11 border-secondary/30 bg-white/70 text-sm font-bold rounded-xl"
                    type="number" 
                    step="0.1"
                    value={formData.avgWeight} 
                    placeholder={formData.animalType === 'broilers' ? "2.5" : "115"}
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
                    placeholder="1.6"
                    onChange={(e) => updateField('fcr', e.target.value)} 
                  />
                </div>
              </>
            )}

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
                      placeholder="42"
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
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-secondary uppercase tracking-widest">Measured Fecal Nitrogen (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.fecalN} 
                      placeholder="4.50"
                      onChange={(e) => updateField('fecalN', e.target.value)} 
                      className="h-11 font-black bg-white/70" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5" /> Nitrogen / Protein Digestibility
                    </Label>
                    <Input 
                      className="h-11 border-primary/30 bg-white/70 text-sm font-bold rounded-xl"
                      type="number" 
                      step="0.01"
                      placeholder="0.85"
                      value={formData.nitrogenDigestibility} 
                      onChange={(e) => updateField('nitrogenDigestibility', e.target.value)} 
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3 animate-in fade-in duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Dietary Crude Protein (%)</Label>
                  {isPhased ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Gestation' : 'Phase 1'}</Label>
                        <Input type="number" step="0.1" value={formData.phase1CP} placeholder="22.0" onChange={(e) => updateField('phase1CP', e.target.value)} className="h-9 font-black" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Lactation' : 'Phase 2'}</Label>
                        <Input type="number" step="0.1" value={formData.phase2CP} placeholder="20.0" onChange={(e) => updateField('phase2CP', e.target.value)} className="h-9 font-black" />
                      </div>
                      {formData.animalType !== 'swine-sow' && (
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Phase 3</Label>
                          <Input type="number" step="0.1" value={formData.phase3CP} placeholder="18.5" onChange={(e) => updateField('phase3CP', e.target.value)} className="h-9 font-black" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input type="number" step="0.1" value={formData.feedCrudeProtein} placeholder="16.0" onChange={(e) => updateField('feedCrudeProtein', e.target.value)} className="h-11 font-black" />
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
                    placeholder="1.20"
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
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Gestation' : 'Phase 1'}</Label>
                        <Input type="number" step="0.01" value={formData.phase1P} placeholder="0.65" onChange={(e) => updateField('phase1P', e.target.value)} className="h-9 font-black" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">{formData.animalType === 'swine-sow' ? 'Lactation' : 'Phase 2'}</Label>
                        <Input type="number" step="0.01" value={formData.phase2P} placeholder="0.60" onChange={(e) => updateField('phase2P', e.target.value)} className="h-9 font-black" />
                      </div>
                      {formData.animalType !== 'swine-sow' && (
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Phase 3</Label>
                          <Input type="number" step="0.01" value={formData.phase3P} placeholder="0.55" onChange={(e) => updateField('phase3P', e.target.value)} className="h-9 font-black" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input type="number" step="0.01" value={formData.feedPhosphorus} placeholder="0.50" onChange={(e) => updateField('feedPhosphorus', e.target.value)} className="h-11 font-black" />
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
