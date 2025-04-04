
import { useState } from "react";
import { useDebate } from "@/context/DebateContext";
import SpeakerCard from "./SpeakerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Settings, Users } from "lucide-react";
import { toast } from "@/lib/toast";

const DebateSpeakers = () => {
  const { 
    speakers, 
    setSpeakers,
    activeListener, 
    currentSpeakerId,
    setCurrentSpeakerId,
    addSpeaker,
    removeSpeaker,
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
      toast.error("Cannot remove speakers while listening", {
        description: "Stop the microphone before removing speakers."
      });
      return;
    }
    
    removeSpeaker(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 flex items-center gap-1">
          <Users className="h-4 w-4" />
          Speakers ({speakers.length})
        </h3>
        
        <div className="flex gap-1">
          {!isEditingSpeakers && !activeListener && (
            <Button 
              onClick={addSpeaker} 
              variant="outline" 
              size="xs"
              className="h-6 text-xs flex gap-1 items-center rounded-full"
            >
              <UserPlus className="h-3 w-3" />
              Add
            </Button>
          )}
          
          <Button
            onClick={() => setIsEditingSpeakers(!isEditingSpeakers)}
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isEditingSpeakers ? (
        <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
          {speakers.map((speaker, i) => (
            <div key={speaker.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`speaker-${i}`} className="text-xs font-medium block">
                  Speaker {i + 1}:
                </label>
                {speakers.length > 2 && (
                  <Button 
                    onClick={() => handleRemoveSpeaker(speaker.id)} 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
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
                className="border-slate-200 rounded-lg h-8 text-sm"
              />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t mt-4">
            <Button
              onClick={addSpeaker}
              variant="outline"
              size="sm"
              className="text-xs flex gap-1 items-center rounded-full"
              disabled={speakers.length >= 8}
            >
              <UserPlus className="h-3 w-3" />
              Add Speaker
            </Button>
            <div className="flex items-center">
              <Button 
                onClick={() => setIsEditingSpeakers(false)} 
                variant="ghost" 
                className="mr-2"
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveSpeakerChanges} 
                size="sm"
                className="purple-gradient rounded-full"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="relative">
              <SpeakerCard 
                speaker={speaker}
                isActive={activeListener && currentSpeakerId === speaker.id}
                onClick={() => setCurrentSpeakerId(speaker.id)}
                emotion={undefined}
              />
              {!activeListener && speakers.length > 2 && (
                <Button
                  onClick={() => handleRemoveSpeaker(speaker.id)}
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full absolute -top-2 -right-2 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-300"
                  title={`Remove ${speaker.name}`}
                >
                  <UserMinus className="h-3 w-3 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebateSpeakers;
