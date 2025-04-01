
import { TranscriptEntry } from "@/context/DebateContext";

// Use the Web Speech API for real speech recognition
export const startSpeechRecognition = (
  speakerId: string,
  onTranscript: (text: string, isClaim: boolean) => void
) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error("Speech recognition is not supported in this browser.");
    return () => {};
  }

  // Initialize speech recognition
  // @ts-ignore - TypeScript doesn't have built-in types for webkitSpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  let finalTranscript = '';
  let interimTranscript = '';
  
  recognition.onstart = () => {
    console.log("Speech recognition started");
  };
  
  recognition.onresult = (event: any) => {
    interimTranscript = '';
    
    // Collect the interim transcript
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript = event.results[i][0].transcript;
        // Process the final transcript
        processFinalTranscript(finalTranscript, speakerId, onTranscript);
        finalTranscript = ''; // Reset for next statement
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error("Speech recognition error", event.error);
  };
  
  recognition.onend = () => {
    console.log("Speech recognition ended");
  };
  
  // Start recognition
  try {
    recognition.start();
  } catch (e) {
    console.error("Error starting speech recognition:", e);
  }
  
  // Return cleanup function
  return () => {
    try {
      recognition.stop();
    } catch (e) {
      console.error("Error stopping speech recognition:", e);
    }
  };
};

// Process a complete statement and detect if it's a claim
const processFinalTranscript = (
  text: string,
  speakerId: string,
  onTranscript: (text: string, isClaim: boolean) => void
) => {
  // Only process non-empty statements
  if (text.trim()) {
    const isClaim = detectClaim(text);
    onTranscript(text, isClaim);
  }
};

// In a real app, we would use NLP/AI for better claim detection
// For now, we'll use a simple keyword-based approach
export const detectClaim = (text: string): boolean => {
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
    "obviously",
    "according to",
    "statistics show",
    "data indicates",
    "experts agree",
    "it is known",
    "undeniable",
    "definitely",
    "certainly",
    "always",
    "never"
  ];
  
  const lowerText = text.toLowerCase();
  return claimIndicators.some(indicator => 
    lowerText.includes(indicator.toLowerCase())
  );
};
