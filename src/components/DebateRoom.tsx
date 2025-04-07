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
    <div className="flex flex-col min-h-screen bg-gray-50">
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
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h2 className="text-lg font-medium mb-4 border-b pb-2">Fact Check Results</h2>
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">
                  {factChecks.length > 0 ? (
                    factChecks.map(factCheck => (
                      <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                    ))
                  ) : (
                    <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                      <p className="mb-2">No fact checks yet</p>
                      <p className="text-xs">Start speaking to generate claims</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === "speakers" && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <SpeakerPanel />
          </div>
        )}
        
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
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
