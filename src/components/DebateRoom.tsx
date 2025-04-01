
import { useDebate } from "@/context/DebateContext";
import SpeakerCard from "./SpeakerCard";
import TranscriptDisplay from "./TranscriptDisplay";
import FactCheckResults from "./FactCheckResult";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Bug, Trash2, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { startSpeechRecognition } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const DebateRoom = () => {
  const { 
    speakers, 
    setSpeakers,
    activeListener, 
    setActiveListener,
    addTranscriptEntry,
    clearTranscript,
    currentSpeakerId,
    setCurrentSpeakerId,
    claims,
    addFactCheck,
    debugMode,
    setDebugMode
  } = useDebate();
  
  const [isEditingSpeakers, setIsEditingSpeakers] = useState(false);
  const [speakerNames, setSpeakerNames] = useState(speakers.map(s => s.name));

  // Handle microphone toggle
  const toggleMicrophone = () => {
    if (!activeListener) {
      toast.success("Microphone activated", {
        description: "The debate fact-checking system is now listening."
      });
    } else {
      toast.info("Microphone deactivated", {
        description: "The debate fact-checking system is now paused."
      });
    }
    setActiveListener(!activeListener);
  };
  
  // Start/stop speech recognition
  useEffect(() => {
    if (!activeListener) return;
    
    // Start speech recognition
    const stopRecognition = startSpeechRecognition(currentSpeakerId, (text, isClaim) => {
      // Add to transcript
      addTranscriptEntry({
        text,
        speakerId: currentSpeakerId,
        timestamp: new Date(),
        isClaim
      });
    });
    
    // Cleanup on unmount or when listener is deactivated
    return () => {
      stopRecognition();
    };
  }, [activeListener, currentSpeakerId, addTranscriptEntry]);
  
  // Process new claims for fact checking
  useEffect(() => {
    if (claims.length === 0) return;
    
    // Get the most recent claim
    const lastClaim = claims[claims.length - 1];
    
    // Check if we've already processed this claim
    const isProcessed = lastClaim.hasOwnProperty('processed');
    if (isProcessed) return;
    
    // Mark as processed (to avoid duplicate checks)
    Object.defineProperty(lastClaim, 'processed', {
      value: true,
      enumerable: false
    });
    
    // Run fact check (with a small delay to simulate processing time)
    setTimeout(() => {
      const factCheckResult = checkFactAgainstDatabase(lastClaim);
      addFactCheck(factCheckResult);
    }, 1500);
  }, [claims, addFactCheck]);
  
  // Handle speaker name changes
  const handleSpeakerNameChange = (index: number, name: string) => {
    const newNames = [...speakerNames];
    newNames[index] = name;
    setSpeakerNames(newNames);
  };

  // Save speaker changes
  const saveSpeakerChanges = () => {
    setSpeakers(speakers.map((speaker, i) => ({
      ...speaker,
      name: speakerNames[i],
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${speakerNames[i]}`
    })));
    setIsEditingSpeakers(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Debate Guardians</CardTitle>
              <CardDescription>Real-time fact-checking for honest debates</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="debug-mode" 
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                />
                <Label htmlFor="debug-mode" className="flex items-center gap-1">
                  <Bug className="h-4 w-4" />
                  Debug Mode
                </Label>
              </div>
              <Button
                onClick={() => clearTranscript()}
                variant="outline"
                size="icon"
                title="Clear transcript"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsEditingSpeakers(!isEditingSpeakers)}
                variant="outline"
                size="icon"
                title="Edit speakers"
                className={cn(isEditingSpeakers && "bg-muted")}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                onClick={toggleMicrophone}
                variant={activeListener ? "destructive" : "default"}
                className="flex items-center gap-2"
                disabled={isEditingSpeakers}
              >
                {activeListener ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Speaker sections */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium mb-3">Speakers</h3>
              {isEditingSpeakers ? (
                <div className="space-y-4">
                  {speakers.map((speaker, i) => (
                    <div key={speaker.id} className="space-y-2">
                      <label htmlFor={`speaker-${i}`} className="text-sm font-medium">
                        Speaker {i + 1} Name:
                      </label>
                      <Input
                        id={`speaker-${i}`}
                        value={speakerNames[i]}
                        onChange={(e) => handleSpeakerNameChange(i, e.target.value)}
                        placeholder={`Speaker ${i + 1}`}
                      />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => setIsEditingSpeakers(false)} 
                      variant="ghost" 
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button onClick={saveSpeakerChanges}>Save</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
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
            </div>
            
            {/* Main content area */}
            <div className="md:col-span-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TranscriptDisplay />
                <FactCheckResults />
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between text-sm text-muted-foreground pt-2 pb-4 border-t">
          <p>Debate Guardians v1.0</p>
          <p>Using Web Speech API & Fact-Check Database</p>
        </CardFooter>
      </Card>
      
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-medium mb-2">Using the app</h3>
        <p className="text-sm mb-3">
          1. Click "Start Listening" and begin speaking
        </p>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>Make statements containing phrases like "studies show", "everyone knows", etc.</li>
          <li>The system will identify these as claims and check them against the database</li>
          <li>False claims will trigger an alert sound</li>
          <li>Accuracy scores are calculated for each speaker</li>
          <li>Click on a speaker to set them as the current speaker</li>
        </ul>
      </Card>
    </div>
  );
};

export default DebateRoom;
