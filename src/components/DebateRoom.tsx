
import { useDebate } from "@/context/DebateContext";
import SpeakerCard from "./SpeakerCard";
import TranscriptDisplay from "./TranscriptDisplay";
import FactCheckResults from "./FactCheckResult";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Bug, Trash2, Settings, Smile, Frown, Angry, Meh, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { startSpeechRecognition, EmotionType } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [emotionDetectionEnabled, setEmotionDetectionEnabled] = useState(false);

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
    
    // Start speech recognition with emotion detection if enabled
    const stopRecognition = startSpeechRecognition(
      currentSpeakerId, 
      (text, isClaim) => {
        // Add to transcript
        addTranscriptEntry({
          text,
          speakerId: currentSpeakerId,
          timestamp: new Date(),
          isClaim,
          emotion: emotionDetectionEnabled ? currentEmotion : undefined
        });
      },
      emotionDetectionEnabled ? setCurrentEmotion : undefined
    );
    
    // Cleanup on unmount or when listener is deactivated
    return () => {
      stopRecognition();
    };
  }, [activeListener, currentSpeakerId, addTranscriptEntry, emotionDetectionEnabled, currentEmotion]);
  
  // Get emotion icon based on detected emotion
  const getEmotionIcon = (emotion: EmotionType) => {
    switch (emotion) {
      case 'angry':
        return <Angry className="text-red-500" />;
      case 'happy':
        return <Smile className="text-green-500" />;
      case 'sad':
        return <Frown className="text-blue-500" />;
      case 'excited':
        return <Smile className="text-yellow-500" />;
      case 'frustrated':
        return <Angry className="text-orange-500" />;
      case 'uncertain':
        return <Meh className="text-purple-500" />;
      default:
        return <Meh className="text-gray-500" />;
    }
  };
  
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
    
    // Show processing indicator
    if (debugMode) {
      toast.info(`AI analyzing claim: ${lastClaim.text.substring(0, 50)}...`, {
        description: "Checking facts against scientific evidence...",
        duration: 2000,
      });
    }
    
    // Run AI fact check
    const checkFact = async () => {
      try {
        // Call our async fact-check service
        const factCheckResult = await checkFactAgainstDatabase(lastClaim);
        addFactCheck(factCheckResult);
      } catch (error) {
        console.error("Error during fact check:", error);
        // Handle error gracefully
        addFactCheck({
          claimId: lastClaim.id,
          verdict: 'unverified',
          source: "Error processing",
          explanation: "An error occurred while fact-checking this claim."
        });
      }
    };
    
    checkFact();
  }, [claims, addFactCheck, debugMode]);
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                  Debate Guardians
                </CardTitle>
                <CardDescription className="text-slate-600">
                  AI-powered fact-checking for more honest debates
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="emotion-detection" 
                    checked={emotionDetectionEnabled}
                    onCheckedChange={setEmotionDetectionEnabled}
                  />
                  <Label htmlFor="emotion-detection" className="flex items-center gap-1 text-sm">
                    {getEmotionIcon(currentEmotion)}
                    Emotion Detection
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="debug-mode" 
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                  <Label htmlFor="debug-mode" className="flex items-center gap-1 text-sm">
                    <Bug className="h-4 w-4" />
                    Debug
                  </Label>
                </div>
                <Button
                  onClick={() => clearTranscript()}
                  variant="outline"
                  size="icon"
                  title="Clear transcript"
                  className="border-slate-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsEditingSpeakers(!isEditingSpeakers)}
                  variant="outline"
                  size="icon"
                  title="Edit speakers"
                  className={cn(
                    "border-slate-200",
                    isEditingSpeakers && "bg-muted"
                  )}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  onClick={toggleMicrophone}
                  variant={activeListener ? "destructive" : "default"}
                  className="flex items-center gap-2 shadow-md"
                  disabled={isEditingSpeakers}
                  size="sm"
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
          
          <CardContent className="px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Speaker sections */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-slate-800">Speakers</h3>
                  {emotionDetectionEnabled && activeListener && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs flex gap-1 items-center">
                          <Info className="h-3 w-3" />
                          Emotions
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium">Voice Emotion Detection</h4>
                          <p className="text-sm text-muted-foreground">
                            The system analyzes voice patterns to detect emotions:
                          </p>
                          <ul className="text-xs space-y-1.5">
                            <li className="flex items-center gap-2">
                              <Angry className="h-4 w-4 text-red-500" /> Angry: Raised voice, sharp tones
                            </li>
                            <li className="flex items-center gap-2">
                              <Smile className="h-4 w-4 text-green-500" /> Happy: Upbeat, energetic patterns
                            </li>
                            <li className="flex items-center gap-2">
                              <Frown className="h-4 w-4 text-blue-500" /> Sad: Lower, slower speech patterns
                            </li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {isEditingSpeakers ? (
                  <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
                    {speakers.map((speaker, i) => (
                      <div key={speaker.id} className="space-y-2">
                        <label htmlFor={`speaker-${i}`} className="text-sm font-medium block">
                          Speaker {i + 1} Name:
                        </label>
                        <Input
                          id={`speaker-${i}`}
                          value={speakerNames[i]}
                          onChange={(e) => handleSpeakerNameChange(i, e.target.value)}
                          placeholder={`Speaker ${i + 1}`}
                          className="border-slate-200"
                        />
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={() => setIsEditingSpeakers(false)} 
                        variant="ghost" 
                        className="mr-2"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveSpeakerChanges} size="sm">Save</Button>
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
                        emotion={currentSpeakerId === speaker.id && emotionDetectionEnabled ? currentEmotion : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Main content area */}
              <div className="lg:col-span-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TranscriptDisplay />
                  <FactCheckResults />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between text-sm text-muted-foreground pt-2 pb-4 border-t">
            <p>Debate Guardians v1.0</p>
            <p>Using Web Speech API & AI-Powered Fact-Checking</p>
          </CardFooter>
        </Card>
        
        <Card className="p-5 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Using the Debate Guardian</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
                <div>
                  <p className="mb-2 font-medium text-slate-900">Getting Started:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Select a speaker by clicking their card</li>
                    <li>Click "Start Listening" and begin speaking</li>
                    <li>Make claims to see them fact-checked in real-time</li>
                  </ol>
                </div>
                
                <div>
                  <p className="mb-2 font-medium text-slate-900">Features:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Voice emotion detection analyzes speaker's tone</li>
                    <li>AI fact-checking identifies and verifies claims</li>
                    <li>Claims containing facts are automatically detected</li>
                    <li>Speaker accuracy scores are calculated over time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DebateRoom;
