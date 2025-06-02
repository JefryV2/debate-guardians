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
    <div className="min-h-screen bg-gray-50">
      <Header 
        aiEnabled={aiEnabled}
        setApiKeyDialogOpen={setApiKeyDialogOpen}
        emotionDetectionEnabled={emotionDetectionEnabled}
        setEmotionDetectionEnabled={setEmotionDetectionEnabled}
        activeListener={activeListener}
        toggleMicrophone={toggleMicrophone}
      />
      
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Navigation</h2>
          </div>
          <TabNavigation 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 p-6 overflow-auto">
            {activeTab === "transcript" && (
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* Transcript Section */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Live Transcript</h2>
                        <ToleranceSlider />
                      </div>
                      <TranscriptDisplay />
                    </div>
                  </div>
                  
                  {/* Fact Check Results */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Fact Checks
                    </h2>
                    <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {factChecks.length > 0 ? (
                        factChecks.map(factCheck => (
                          <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                        ))
                      ) : (
                        <div className="text-center p-8 text-gray-400">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🔍</span>
                          </div>
                          <p className="font-medium mb-1">No fact checks yet</p>
                          <p className="text-sm">Start speaking to generate claims</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "upload" && (
              <div className="max-w-4xl mx-auto">
                <FileUploadPanel />
              </div>
            )}
            
            {activeTab === "speakers" && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
                <SpeakerPanel />
              </div>
            )}
            
            {activeTab === "analytics" && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
                <AnalyticsPanel />
              </div>
            )}
          </main>
        </div>
      </div>
      
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
