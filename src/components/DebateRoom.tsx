import { useDebate } from "@/context/DebateContext";
import { useState, useEffect } from "react";
import { startSpeechRecognition } from "@/services/speechService";
import { hybridFactCheck, FactCheckMode } from "@/services/hybridFactCheckService";
import { toast } from "@/lib/toast";
import { EmotionType } from "@/services/speechService";

// Import components
import Header from "./Header";
import TabNavigation from "./TabNavigation";
import TranscriptWithUpload from "./TranscriptWithUpload";
import SpeakerPanel from "./SpeakerPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import FactCheckResult from "./FactCheckResult";
import ApiKeyDialog from "./ApiKeyDialog";
import FileUploadPanel from "./FileUploadPanel";
import SpeakerCard from "./SpeakerCard";
import SpeakerStats from "./SpeakerStats";
import AboutPage from "./AboutPage";
import SettingsPanel from "./SettingsPanel";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const DebateRoom = () => {
  const { 
    activeListener, 
    setActiveListener,
    addTranscriptEntry,
    clearTranscript,
    currentSpeakerId,
    claims,
    addFactCheck,
    debugMode,
    continuousAnalysisMode,
    setContinuousAnalysisMode,
    factChecks: contextFactChecks,
    speakers,
    setCurrentSpeakerId,
    addSpeaker,
    removeSpeaker,
    updateSpeakerName
  } = useDebate();
  
  const [activeTab, setActiveTab] = useState("transcript");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [emotionDetectionEnabled, setEmotionDetectionEnabled] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini-api-key") || "");
  const [aiEnabled, setAiEnabled] = useState(Boolean(localStorage.getItem("gemini-api-key")));
  const [factChecks, setFactChecks] = useState([]);

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
      const savedMode = localStorage.getItem("fact-check-mode") as FactCheckMode || "hybrid";
      const modeDescriptions = {
        "claimbuster": "Using ClaimBuster for claim detection",
        "hybrid": "Using Hybrid AI fact-checking (ClaimBuster + Search + Gemini)",
        "gemini": "Using Gemini AI for fact-checking"
      };
      
      toast.info(`AI analyzing claim: ${lastClaim.text.substring(0, 50)}...`, {
        description: modeDescriptions[savedMode],
        duration: 2000,
      });
    }
    
    const checkFact = async () => {
      try {
        // Determine which fact-checking mode to use based on user preference
        const savedMode = localStorage.getItem("fact-check-mode") as FactCheckMode || "hybrid";
        const factCheckResult = await hybridFactCheck(lastClaim, savedMode);
        addFactCheck(factCheckResult);
        setFactChecks(prevChecks => [...prevChecks, factCheckResult]);
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

  useEffect(() => {
    setFactChecks(contextFactChecks);
  }, [contextFactChecks]);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <Header 
        aiEnabled={aiEnabled}
        setApiKeyDialogOpen={setApiKeyDialogOpen}
        emotionDetectionEnabled={emotionDetectionEnabled}
        setEmotionDetectionEnabled={setEmotionDetectionEnabled}
        activeListener={activeListener}
        toggleMicrophone={toggleMicrophone}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <main className="flex-1 overflow-auto p-6">
            {activeTab === "transcript" && (
              <div className="h-full max-w-8xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                  {/* Speakers Section */}
                  <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl border border-border h-full flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-4 border-b border-border bg-card rounded-t-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-bold text-foreground">Speakers</h2>
                            <p className="text-xs text-muted-foreground">Active speaker highlighted</p>
                          </div>
                          <Button 
                            onClick={addSpeaker}
                            variant="outline" 
                            size="sm"
                            className="h-8 px-3 text-xs rounded-md border border-border shadow-sm hover:shadow transition-all duration-200"
                            disabled={speakers.length >= 8}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                            Add
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                        {speakers.map(speaker => (
                          <SpeakerCard 
                            key={speaker.id}
                            speaker={speaker}
                            isActive={activeListener && currentSpeakerId === speaker.id}
                            onClick={() => setCurrentSpeakerId(speaker.id)}
                            onRemove={() => removeSpeaker(speaker.id)}
                            showRemoveButton={speakers.length > 2 && !activeListener}
                            onNameChange={updateSpeakerName}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transcript Section with Upload */}
                  <div className="lg:col-span-2">
                    <div className="bg-card rounded-xl border border-border h-full shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                      <TranscriptWithUpload />
                    </div>
                  </div>
                  
                  {/* Fact Check Results */}
                  <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl border border-border p-4 h-full flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <span className="w-3 h-3 bg-primary rounded-full"></span>
                          Fact Checks
                        </h2>
                        <span className="text-xs bg-muted text-foreground px-2.5 py-1 rounded-full font-semibold shadow-sm">
                          {factChecks.length} items
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {factChecks.length > 0 ? (
                          <div className="space-y-3">
                            {factChecks.map(factCheck => (
                              <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-lg bg-card border border-border">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 shadow-sm">
                              <span className="text-xl">🔍</span>
                            </div>
                            <p className="font-bold text-base mb-1 text-foreground">No fact checks yet</p>
                            <p className="text-xs text-muted-foreground">Start speaking to generate claims</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "speakers" && (
              <div className="h-full w-full">
                <div className="bg-card rounded-xl border border-border p-6 h-full shadow-lg">
                  <SpeakerPanel />
                </div>
              </div>
            )}
            
            {activeTab === "analytics" && (
              <div className="h-full w-full">
                <div className="bg-card rounded-xl border border-border p-6 h-full shadow-lg">
                  <AnalyticsPanel />
                </div>
              </div>
            )}
            
            {activeTab === "about" && (
              <div className="h-full w-full">
                <AboutPage />
              </div>
            )}
            
            {activeTab === "settings" && (
              <div className="h-full w-full">
                <SettingsPanel />
              </div>
            )}
          </main>
        </div>
      </div>
      
      <ApiKeyDialog 
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        apiKey={apiKey}
        setApiKey={setApiKey}
        saveApiKey={saveApiKey}
      />
    </div>
  );
};

export default DebateRoom;