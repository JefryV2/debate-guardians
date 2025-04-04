import { useDebate } from "@/context/DebateContext";
import SpeakerCard from "./SpeakerCard";
import SpeakerStats from "./SpeakerStats";
import TranscriptDisplay from "./TranscriptDisplay";
import FactCheckResult from "./FactCheckResult";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Mic, MicOff, Bug, Trash2, Settings, Smile, Frown, Angry, 
  Meh, Info, Shield, UserPlus, UserMinus, Users, Lightbulb, 
  BarChart2, FileText, GitCompare, Flag, Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { startSpeechRecognition, EmotionType } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);

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

  const toggleMicrophone = async () => {
    if (!activeListener) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setMicPermissionGranted(true);
        setErrorMessage(null);
        
        toast.success("Microphone activated", {
          description: "The debate fact-checking system is now listening."
        });
      } catch (error) {
        console.error("Microphone permission error:", error);
        setMicPermissionGranted(false);
        setErrorMessage("Microphone access denied. Please enable microphone permissions in your browser settings.");
        
        toast.error("Microphone access denied", {
          description: "Please enable microphone permissions in your browser settings."
        });
        return;
      }
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
        if (text.includes("microphone access denied") || 
            text.includes("not supported") || 
            text.includes("No microphone")) {
          setErrorMessage(text);
          setActiveListener(false);
          toast.error("Microphone issue", {
            description: text
          });
          return;
        }
        
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <Card className="mb-6 neo-card border-0 overflow-hidden">
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold purple-gradient-text">
                  Debate Guardians
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {aiEnabled ? "Gemini AI-powered fact-checking" : "AI-powered fact-checking"} for more honest debates
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setApiKeyDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-slate-200 flex items-center gap-1 rounded-full", 
                    aiEnabled ? "text-violet-600" : ""
                  )}
                >
                  <Shield className="h-4 w-4" />
                  {aiEnabled ? "AI Enabled" : "Setup AI"}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="emotion-detection" 
                    checked={emotionDetectionEnabled}
                    onCheckedChange={setEmotionDetectionEnabled}
                    className="data-[state=checked]:bg-violet-600"
                  />
                  <Label htmlFor="emotion-detection" className="flex items-center gap-1 text-sm">
                    {getEmotionIcon(currentEmotion)}
                    Emotion
                  </Label>
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-200 flex items-center gap-1 rounded-full">
                      <Sparkles className="h-4 w-4" />
                      Features
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 neo-card border-0">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Analysis Features</h4>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="continuous-analysis" 
                          checked={continuousAnalysisMode}
                          onCheckedChange={setContinuousAnalysisMode}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Label htmlFor="continuous-analysis" className="text-sm flex items-center gap-1">
                          <GitCompare className="h-3 w-3" />
                          Continuous Analysis
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="fallacy-detection" 
                          checked={fallacyDetectionEnabled}
                          onCheckedChange={setFallacyDetectionEnabled}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Label htmlFor="fallacy-detection" className="text-sm flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Fallacy Detection
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="knowledge-gap-detection" 
                          checked={knowledgeGapDetectionEnabled}
                          onCheckedChange={setKnowledgeGapDetectionEnabled}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Label htmlFor="knowledge-gap-detection" className="text-sm flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Knowledge Gap Detection
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="debug-mode" 
                          checked={debugMode}
                          onCheckedChange={setDebugMode}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Label htmlFor="debug-mode" className="text-sm flex items-center gap-1">
                          <Bug className="h-3 w-3" />
                          Debug Mode
                        </Label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  onClick={() => clearTranscript()}
                  variant="outline"
                  size="icon"
                  title="Clear transcript"
                  className="border-slate-200 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsEditingSpeakers(!isEditingSpeakers)}
                  variant="outline"
                  size="icon"
                  title="Edit speakers"
                  className={cn(
                    "border-slate-200 rounded-full",
                    isEditingSpeakers && "bg-muted"
                  )}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  onClick={toggleMicrophone}
                  variant={activeListener ? "destructive" : "default"}
                  className="flex items-center gap-2 shadow-md rounded-full"
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
            {errorMessage && (
              <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-lg text-red-800 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-medium">Microphone Issue Detected</p>
                  <p className="text-sm mt-1">{errorMessage}</p>
                  <p className="text-xs mt-2">
                    Tips: Make sure your browser has permission to use your microphone. 
                    Speech recognition works best in Chrome, Edge, or Safari.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Tabs defaultValue="speakers" className="w-full">
                  <TabsList className="w-full mb-4 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger 
                      value="speakers" 
                      className="flex items-center gap-1 flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Speakers</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="stats" 
                      className="flex items-center gap-1 flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Stats</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="speakers">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Speakers ({speakers.length})
                      </h3>
                      {!isEditingSpeakers && !activeListener && (
                        <Button 
                          onClick={addSpeaker} 
                          variant="outline" 
                          size="sm"
                          className="text-xs flex gap-1 items-center rounded-full"
                        >
                          <UserPlus className="h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>

                    {isEditingSpeakers ? (
                      <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
                        {speakers.map((speaker, i) => (
                          <div key={speaker.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label htmlFor={`speaker-${i}`} className="text-sm font-medium block">
                                Speaker {i + 1} Name:
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
                              className="border-slate-200 rounded-lg"
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
                    <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-3">
                      <BarChart2 className="h-4 w-4" />
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
              
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TranscriptDisplay />
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-3">
                      <BarChart2 className="h-4 w-4" />
                      Fact Check Results
                    </h3>
                    {factChecks.map(factCheck => (
                      <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                    ))}
                    {factChecks.length === 0 && (
                      <div className="text-center p-8 text-slate-500">
                        No fact checks yet. Start speaking to generate some claims!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between text-sm text-muted-foreground pt-2 pb-4 border-t">
            <p>Debate Guardians v2.0</p>
            <p>Using {aiEnabled ? "Gemini AI" : "Web Speech API"} & Advanced Fact-Checking</p>
          </CardFooter>
        </Card>
        
        <Card className="p-5 neo-card border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md">
          <div className="flex items-start">
            <div className="bg-violet-100 p-2 rounded-full mr-3">
              <Info className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Using the Debate Guardian</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
                <div>
                  <p className="mb-2 font-medium text-slate-900">Getting Started:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Click "Setup AI" to add your Gemini API key</li>
                    <li>Select a speaker by clicking their card</li>
                    <li>Click "Start Listening" and begin speaking</li>
                    <li>Make claims to see them fact-checked in real-time</li>
                    <li><strong>NEW:</strong> Manually mark entries as claims with the flag button</li>
                  </ol>
                </div>
                
                <div>
                  <p className="mb-2 font-medium text-slate-900">Advanced Features:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>NEW:</strong> Continuous analysis mode for multi-sentence claims</li>
                    <li><strong>NEW:</strong> Manual claim highlighting for missed claims</li>
                    <li>Logical fallacy detection with automatic warnings</li>
                    <li>Speech rate monitoring to detect fast talking</li>
                    <li>Topic classification for claims</li>
                    <li>Knowledge gap identification for uncertain topics</li>
                    <li>Historical claim tracking for speakers</li>
                    <li>Confidence ratings for all fact-checks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md neo-card border-0">
          <DialogHeader>
            <DialogTitle>Set up Gemini AI Integration</DialogTitle>
            <DialogDescription>
              Enter your Google Gemini API key to enable advanced AI-powered fact-checking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <Input 
                id="gemini-api-key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="col-span-3 border-slate-200"
              />
              <p className="text-sm text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              onClick={saveApiKey}
              className="purple-gradient"
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
