
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
    setSpeakers
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
        <TabsList className="w-full mb-4 grid grid-cols-2">
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="speakers">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium">
              Speakers ({speakers.length})
            </h3>
            {!isEditingSpeakers && !activeListener && (
              <Button 
                onClick={() => setIsEditingSpeakers(true)} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                Edit Speakers
              </Button>
            )}
          </div>

          {isEditingSpeakers ? (
            <div className="space-y-4">
              {speakers.map((speaker, i) => (
                <div key={speaker.id} className="space-y-2 border p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`speaker-${i}`} className="text-sm font-medium block">
                      Speaker {i + 1}
                    </label>
                    {speakers.length > 2 && (
                      <Button 
                        onClick={() => handleRemoveSpeaker(speaker.id)} 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id={`speaker-${i}`}
                    value={speakerNames[i]}
                    onChange={(e) => handleSpeakerNameChange(i, e.target.value)}
                    placeholder={`Speaker ${i + 1}`}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={addSpeaker}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={speakers.length >= 8}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add Speaker
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setIsEditingSpeakers(false)} 
                    variant="ghost" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveSpeakerChanges} 
                    size="sm"
                  >
                    Save
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
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <h3 className="text-md font-medium mb-3">
            Speaker Stats
          </h3>
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
