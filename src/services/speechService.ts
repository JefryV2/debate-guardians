
import { TranscriptEntry } from "@/context/DebateContext";

// Mock function to simulate transcription - would be replaced with Whisper API
export const startSpeechRecognition = (
  speakerId: string,
  onTranscript: (text: string, isClaim: boolean) => void
) => {
  // In a real implementation, we would connect to WebSocket or use the Web Speech API
  // For MVP, we'll simulate transcription
  
  let active = true;
  
  const simulateTranscription = () => {
    if (!active) return;
    
    // Randomly decide if this is a real transcription or just background noise
    const isRealTranscription = Math.random() > 0.3;
    
    if (isRealTranscription) {
      // Select a random statement, sometimes with claims
      const statements = [
        { text: "I believe we should focus on economic growth.", isClaim: false },
        { text: "Studies show that vaccines cause autism.", isClaim: true },
        { text: "Climate change is not caused by human activity.", isClaim: true },
        { text: "We need to consider multiple perspectives.", isClaim: false },
        { text: "The Earth is flat, that's a scientific fact.", isClaim: true },
        { text: "COVID-19 is just a common cold.", isClaim: true },
        { text: "I think we need more research on this topic.", isClaim: false },
        { text: "Everyone knows that 5G towers spread viruses.", isClaim: true },
        { text: "Let me respond to your point about taxes.", isClaim: false }
      ];
      
      const randomStatement = statements[Math.floor(Math.random() * statements.length)];
      onTranscript(randomStatement.text, randomStatement.isClaim);
    }
    
    // Schedule next transcription after a random delay
    const delay = 3000 + Math.random() * 5000;
    setTimeout(simulateTranscription, delay);
  };
  
  // Start the simulation
  simulateTranscription();
  
  return () => {
    // Cleanup function
    active = false;
  };
};

// In a real app, we would detect claims using NLP/AI
export const detectClaim = (text: string): boolean => {
  // Simple implementation: check for claim indicators
  const claimIndicators = [
    "studies show",
    "research indicates",
    "scientists say",
    "evidence suggests",
    "proven that",
    "everyone knows",
    "fact",
    "truth is",
    "clearly",
    "obviously"
  ];
  
  return claimIndicators.some(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
};
