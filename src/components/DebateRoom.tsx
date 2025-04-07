
import { useDebate } from "@/context/DebateContext";
import SpeakerCard from "./SpeakerCard";
import SpeakerStats from "./SpeakerStats";
import TranscriptDisplay from "./TranscriptDisplay";
import FactCheckResult from "./FactCheckResult";
import ToleranceSlider from "./ToleranceSlider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Mic, MicOff, Bug, Trash2, Settings, Smile, Frown, 
  Info, Shield, UserPlus, UserMinus, Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { startSpeechRecognition, EmotionType } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    setDebugMode,
    addSpeaker,
    removeSpeaker,
    continuousAnalysisMode,
    setContinuousAnalysisMode
  } = useDebate();
  
  const [isEditingSpeakers, setIsEditingSpeakers] = useState(false);
  const [speakerNames, setSpeakerNames] = useState(speakers.map(s => s.name));
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [emotionDetectionEnabled, setEmotionDetectionEnabled] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini-api-key") || "");
  const [aiEnabled, setAiEnabled] = useState(Boolean(localStorage.getItem("gemini-api-key")));
  const [fallacyDetectionEnabled, setFallacyDetectionEnabled] = useState(true);
  const [knowledgeGapDetectionEnabled, setKnowledgeGapDetectionEnabled] = useState(true);
  const [factChecks, setFactChecks] = useState([]);

  useEffect(() => {
    setSpeakerNames(speakers.map(s => s.name));
  }, [speakers]);
  
  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini-api-key", apiKey.trim());
      setAiEnabled(true);
      toast.success("API key saved", {
        description: "Gemini AI is now enabled for fact-checking"
      });
    } else {
      localStorage.removeItem("gemini-api-key");
      setAiEnabled(false);
      toast.info("API key removed", {
        description: "Using fallback fact-checking system"
      });
    }
    setApiKeyDialogOpen(false);
  };

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

  useEffect(() => {
    if (!activeListener) return;
    
    const stopRecognition = startSpeechRecognition(
      currentSpeakerId, 
      (text, isClaim) => {
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
    
    return () => {
      stopRecognition();
    };
  }, [activeListener, currentSpeakerId, addTranscriptEntry, emotionDetectionEnabled, currentEmotion]);

  const getEmotionIcon = (emotion: EmotionType) => {
    switch (emotion) {
      case 'angry':
        return <Frown className="text-red-500" />;
      case 'happy':
        return <Smile className="text-green-500" />;
      case 'sad':
        return <Frown className="text-blue-500" />;
      default:
        return <Smile className="text-gray-500" />;
    }
  };

  useEffect(() => {
    if (claims.length === 0) return;
    
    const lastClaim = claims[claims.length - 1];
    
    const isProcessed = lastClaim.hasOwnProperty('processed');
    if (isProcessed) return;
    
    Object.defineProperty(lastClaim, 'processed', {
      value: true,
      enumerable: false
    });
    
    if (debugMode) {
      toast.info(`AI analyzing claim: ${lastClaim.text.substring(0, 50)}...`, {
        description: aiEnabled ? "Using Gemini AI for fact-checking" : "Using fallback fact-checking system",
        duration: 2000,
      });
    }
    
    const checkFact = async () => {
      try {
        const factCheckResult = await checkFactAgainstDatabase(lastClaim);
        addFactCheck(factCheckResult);
        setFactChecks([...factChecks, factCheckResult]);
      } catch (error) {
        console.error("Error during fact check:", error);
        addFactCheck({
          claimId: lastClaim.id,
          verdict: 'unverified',
          source: "Error processing",
          explanation: "An error occurred while fact-checking this claim."
        });
      }
    };
    
    checkFact();
  }, [claims, addFactCheck, debugMode, aiEnabled]);

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
    <div className="container mx-auto py-6">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-md border-0 overflow-hidden bg-white">
          <CardHeader className="border-b bg-gray-50 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Debate Guardian
                </CardTitle>
                <p className="text-sm text-gray-500">
                  AI-powered fact-checking for more honest debates
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setApiKeyDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-200 rounded-full"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {aiEnabled ? "AI Enabled" : "Setup AI"}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="emotion-detection" 
                    checked={emotionDetectionEnabled}
                    onCheckedChange={setEmotionDetectionEnabled}
                  />
                  <Label htmlFor="emotion-detection" className="text-sm">Emotion</Label>
                </div>
                
                <Button
                  onClick={() => clearTranscript()}
                  variant="outline"
                  size="icon"
                  title="Clear transcript"
                  className="border-gray-200 rounded-full h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={() => setIsEditingSpeakers(!isEditingSpeakers)}
                  variant="outline"
                  size="icon"
                  title="Edit speakers"
                  className={cn(
                    "border-gray-200 rounded-full h-8 w-8",
                    isEditingSpeakers && "bg-gray-100"
                  )}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={toggleMicrophone}
                  variant={activeListener ? "destructive" : "default"}
                  className="rounded-full"
                  disabled={isEditingSpeakers}
                  size="sm"
                >
                  {activeListener ? (
                    <>
                      <MicOff className="h-4 w-4 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-1" />
                      Start Listening
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Tabs defaultValue="speakers" className="w-full">
                  <TabsList className="w-full mb-4 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger 
                      value="speakers" 
                      className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Speakers
                    </TabsTrigger>
                    <TabsTrigger 
                      value="stats" 
                      className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Stats
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="speakers">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-700">
                        Speakers ({speakers.length})
                      </h3>
                      {!isEditingSpeakers && !activeListener && (
                        <Button 
                          onClick={addSpeaker} 
                          variant="outline" 
                          size="sm"
                          className="text-xs rounded-full"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>

                    {isEditingSpeakers ? (
                      <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        {speakers.map((speaker, i) => (
                          <div key={speaker.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label htmlFor={`speaker-${i}`} className="text-sm font-medium block">
                                Speaker {i + 1}
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
                              className="border-gray-200 rounded-lg"
                            />
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-2 border-t mt-4">
                          <Button
                            onClick={addSpeaker}
                            variant="outline"
                            size="sm"
                            className="text-xs rounded-full"
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
                              className="rounded-full"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                        {speakers.map((speaker) => (
                          <div key={speaker.id} className="relative">
                            <SpeakerCard 
                              speaker={speaker}
                              isActive={activeListener && currentSpeakerId === speaker.id}
                              onClick={() => setCurrentSpeakerId(speaker.id)}
                              emotion={currentSpeakerId === speaker.id && emotionDetectionEnabled ? currentEmotion : undefined}
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
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">
                      Speaker Stats
                    </h3>
                    <div className="space-y-4">
                      {speakers.map((speaker) => (
                        <SpeakerStats key={speaker.id} speaker={speaker} />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6">
                  <ToleranceSlider />
                </div>
              </div>
              
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TranscriptDisplay />
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">
                      Fact Check Results
                    </h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {factChecks.map(factCheck => (
                        <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                      ))}
                      {factChecks.length === 0 && (
                        <div className="text-center p-8 text-gray-400">
                          No fact checks yet. Start speaking to generate some claims!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6 border-0 shadow-md bg-blue-50 p-5">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Using the Debate Guardian</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                <div>
                  <p className="mb-2 font-medium text-gray-800">Getting Started:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Click "Setup AI" to add your API key</li>
                    <li>Select a speaker by clicking their card</li>
                    <li>Click "Start Listening" and begin speaking</li>
                    <li>Make claims to see them fact-checked in real-time</li>
                    <li>Manually mark entries as claims with the flag button</li>
                  </ol>
                </div>
                
                <div>
                  <p className="mb-2 font-medium text-gray-800">Advanced Features:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Continuous analysis for multi-sentence claims</li>
                    <li>Manual claim highlighting for missed claims</li>
                    <li>Logical fallacy detection with warnings</li>
                    <li>Speech rate monitoring to detect fast talking</li>
                    <li>Topic classification for claims</li>
                    <li>Knowledge gap identification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up AI Integration</DialogTitle>
            <DialogDescription>
              Enter your API key to enable advanced AI-powered fact-checking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input 
                id="api-key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="col-span-3"
              />
              <p className="text-sm text-gray-500">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              onClick={saveApiKey}
            >
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DebateRoom;
