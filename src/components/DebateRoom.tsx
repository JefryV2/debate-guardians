
import { useDebate } from "@/context/DebateContext";
import { useState, useEffect } from "react";
import { startSpeechRecognition } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { toast } from "@/lib/toast";

// Import new components
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
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
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

  // Sync factChecks with context
  useEffect(() => {
    setFactChecks(contextFactChecks);
  }, [contextFactChecks]);
  
  return (
    <>
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
      
      <div className="container mx-auto py-6">
        <div className="flex justify-end mb-4">
          <ToleranceSlider />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === "transcript" && (
            <>
              <TranscriptDisplay />
              
              <div>
                <h2 className="text-lg font-medium mb-2">Fact Check Results</h2>
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                  {factChecks.length > 0 ? (
                    factChecks.map(factCheck => (
                      <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                    ))
                  ) : (
                    <div className="text-center p-8 text-gray-400">
                      No fact checks yet. Start speaking to generate some claims!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {activeTab === "speakers" && <SpeakerPanel />}
          
          {activeTab === "analytics" && <AnalyticsPanel />}
        </div>
        
        <HelpPanel />
      </div>
      
      <ApiKeyDialog 
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        apiKey={apiKey}
        setApiKey={setApiKey}
        saveApiKey={saveApiKey}
      />
    </>
  );
};

export default DebateRoom;
