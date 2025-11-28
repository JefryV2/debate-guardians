import React, { useState } from 'react';
import { useDebate } from '@/context/DebateContext';
import SpeakerCard from './SpeakerCard';
import SpeakerStats from './SpeakerStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus } from 'lucide-react';

const SpeakerPanel = () => {
  const { 
    speakers, 
    addSpeaker, 
    removeSpeaker, 
    activeListener,
    currentSpeakerId,
    setCurrentSpeakerId,
    setSpeakers,
    updateSpeakerName
  } = useDebate();
  
  const [isEditingSpeakers, setIsEditingSpeakers] = useState(false);
  const [speakerNames, setSpeakerNames] = useState(speakers.map(s => s.name));

  const handleSpeakerNameChange = (index: number, name: string) => {
    const newNames = [...speakerNames];
    newNames[index] = name;
    setSpeakerNames(newNames);
  };

  const saveSpeakerChanges = () => {
    setSpeakers(speakers.map((speaker, i) => ({
      ...speaker,
      name: speakerNames[i],
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${speakerNames[i]}`
    })));
    setIsEditingSpeakers(false);
  };

  const handleRemoveSpeaker = (id: string) => {
    if (activeListener) {
      return;
    }
    
    removeSpeaker(id);
  };
  
  
  return (
    <div className="h-full">
      <Tabs defaultValue="speakers" className="w-full">
        <TabsList className="w-full mb-6 grid grid-cols-2 bg-muted p-1.5 rounded-xl shadow-inner border border-border">
          <TabsTrigger 
            value="speakers" 
            className="text-base data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold py-3 rounded-lg transition-all duration-300 relative"
          >
            Speakers
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full data-[state=inactive]:hidden"></div>
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="text-base data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold py-3 rounded-lg transition-all duration-300 relative"
          >
            Statistics
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full data-[state=inactive]:hidden"></div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="speakers" className="mt-0">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
            <div>
              <h3 className="text-lg font-bold text-foreground">Speakers</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage debate participants ({speakers.length} total)</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditingSpeakers && activeListener && (
                <span className="text-xs text-muted-foreground">
                  (Recording active - some features disabled)
                </span>
              )}
              <Button 
                onClick={() => setIsEditingSpeakers(true)} 
                variant="default" 
                size="sm"
                className="h-9 px-4 text-sm rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white border border-primary shadow-sm hover:shadow-md transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Edit Speakers
              </Button>
            </div>
          </div>

          {isEditingSpeakers ? (
            <div className="space-y-4 bg-card p-5 rounded-xl border border-border">
              <div className="space-y-4">
                {speakers.map((speaker, i) => (
                  <div key={speaker.id} className="space-y-3 bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`speaker-${i}`} className="text-sm font-semibold text-foreground">
                        Speaker {i + 1}
                      </label>
                      {speakers.length > 2 && (
                        <Button 
                          onClick={() => handleRemoveSpeaker(speaker.id)} 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`speaker-${i}`}
                      value={speakerNames[i]}
                      onChange={(e) => handleSpeakerNameChange(i, e.target.value)}
                      placeholder={`Speaker ${i + 1}`}
                      className="text-base h-11 rounded-lg border-border focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={addSpeaker}
                  variant="outline"
                  size="sm"
                  className="h-10 px-5 text-sm rounded-lg bg-muted hover:bg-muted-foreground/10 border border-border shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={speakers.length >= 8}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Speaker
                </Button>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => setIsEditingSpeakers(false)} 
                    variant="outline" 
                    size="sm"
                    className="h-10 px-5 text-sm rounded-lg border-border hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveSpeakerChanges} 
                    size="sm"
                    className="h-10 px-5 text-sm rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {speakers.map((speaker) => (
                <SpeakerCard 
                  key={speaker.id}
                  speaker={speaker}
                  isActive={activeListener && currentSpeakerId === speaker.id}
                  onClick={() => setCurrentSpeakerId(speaker.id)}
                  onRemove={() => handleRemoveSpeaker(speaker.id)}
                  showRemoveButton={speakers.length > 2 && !activeListener}
                  onNameChange={updateSpeakerName}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stats" className="mt-0">
          <div className="mb-5 pb-3 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Speaker Statistics</h3>
            <p className="text-sm text-muted-foreground mt-1">Detailed performance metrics for each participant</p>
          </div>
          <div className="space-y-4">
            {speakers.map((speaker) => (
              <SpeakerStats key={speaker.id} speaker={speaker} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpeakerPanel;