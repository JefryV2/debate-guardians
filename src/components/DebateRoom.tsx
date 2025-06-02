import { useDebate } from "@/context/DebateContext";
import { useState, useEffect } from "react";
import { startSpeechRecognition } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { toast } from "@/lib/toast";
import { EmotionType } from "@/services/speechService";

// Import components
import Header from "./Header";
import TabNavigation from "./TabNavigation";
import TranscriptDisplay from "./TranscriptDisplay";
import SpeakerPanel from "./SpeakerPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import ToleranceSlider from "./ToleranceSlider";
import FactCheckResult from "./FactCheckResult";
import HelpPanel from "./HelpPanel";
import ApiKeyDialog from "./ApiKeyDialog";
import FileUploadPanel from "./FileUploadPanel";

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
    factChecks: contextFactChecks
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
      toast.info(`AI analyzing claim: ${lastClaim.text.substring(0, 50)}...`, {
        description: aiEnabled ? "Using Gemini AI for fact-checking" : "Using fallback fact-checking system",
        duration: 2000,
      });
    }
    
    const checkFact = async () => {
      try {
        const factCheckResult = await checkFactAgainstDatabase(lastClaim);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <Header 
        aiEnabled={aiEnabled}
        setApiKeyDialogOpen={setApiKeyDialogOpen}
        emotionDetectionEnabled={emotionDetectionEnabled}
        setEmotionDetectionEnabled={setEmotionDetectionEnabled}
        activeListener={activeListener}
        toggleMicrophone={toggleMicrophone}
      />
      
      <TabNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {activeTab === "transcript" && (
          <>
            <div className="flex justify-end mb-4">
              <ToleranceSlider />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TranscriptDisplay />
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-200 shadow-xl">
                <h2 className="text-xl font-bold mb-4 border-b-2 border-purple-300 pb-3 flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  Fact Check Results
                  <span className="text-2xl">✨</span>
                </h2>
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">
                  {factChecks.length > 0 ? (
                    factChecks.map(factCheck => (
                      <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                    ))
                  ) : (
                    <div className="text-center p-8 text-gray-400 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200">
                      <span className="text-4xl mb-3 block">🤔</span>
                      <p className="mb-2 font-medium">No fact checks yet</p>
                      <p className="text-xs">Start speaking to generate claims!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "upload" && (
          <div className="max-w-4xl mx-auto">
            <FileUploadPanel />
          </div>
        )}
        
        {activeTab === "speakers" && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-200 shadow-xl">
            <SpeakerPanel />
          </div>
        )}
        
        {activeTab === "analytics" && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-200 shadow-xl">
            <AnalyticsPanel />
          </div>
        )}
      </main>
      
      <HelpPanel />
      
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
