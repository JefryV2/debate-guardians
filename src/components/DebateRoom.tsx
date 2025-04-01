
import { useDebate } from "@/context/DebateContext";
import SpeakerCard from "./SpeakerCard";
import TranscriptDisplay from "./TranscriptDisplay";
import FactCheckResults from "./FactCheckResult";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Bug } from "lucide-react";
import { useEffect } from "react";
import { startSpeechRecognition } from "@/services/speechService";
import { checkFactAgainstDatabase } from "@/services/factCheckService";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

const DebateRoom = () => {
  const { 
    speakers, 
    activeListener, 
    setActiveListener,
    addTranscriptEntry,
    currentSpeakerId,
    setCurrentSpeakerId,
    claims,
    addFactCheck,
    debugMode,
    setDebugMode
  } = useDebate();
  
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
                onClick={toggleMicrophone}
                variant={activeListener ? "destructive" : "default"}
                className="flex items-center gap-2"
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
          <p>Debate Guardians MVP v1.0</p>
          <p>Powered by Whisper & Fact-Check API</p>
        </CardFooter>
      </Card>
      
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-medium mb-2">About this demo</h3>
        <p className="text-sm mb-3">
          This MVP demonstrates real-time debate fact-checking. In a full version:
        </p>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>OpenAI Whisper would provide accurate speech-to-text</li>
          <li>DistilBERT/GPT-4 would identify claims with higher accuracy</li>
          <li>A comprehensive database and Google Fact Check API would verify claims</li>
          <li>ElevenLabs would provide voice interruptions for corrections</li>
        </ul>
      </Card>
    </div>
  );
};

export default DebateRoom;
