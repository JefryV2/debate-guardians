
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

// Enhanced claim detection using more sophisticated patterns
export const detectClaim = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  
  // Categories of claim indicators with weighted importance
  const strongClaimIndicators = [
    "studies show",
    "research indicates",
    "scientists say",
    "evidence suggests", 
    "proven that",
    "according to",
    "statistics show",
    "data indicates",
    "experts agree",
    "science tells us",
    "research demonstrates",
    "facts show",
    "studies confirm"
  ];
  
  const mediumClaimIndicators = [
    "everyone knows",
    "clearly",
    "obviously",
    "it is known",
    "undeniable",
    "definitely",
    "certainly",
    "always",
    "never",
    "all people",
    "nobody",
    "most people",
    "vast majority"
  ];
  
  const topicalKeywords = [
    "vaccines",
    "climate change",
    "global warming",
    "evolution",
    "flat earth",
    "autism",
    "covid",
    "pandemic",
    "diet",
    "nutrition",
    "cancer",
    "cure",
    "medicine",
    "treatment",
    "study",
    "education",
    "economy",
    "inflation",
    "government",
    "political",
    "immigration",
    "crime",
    "healthcare",
    "gun control",
    "election",
    "transgender",
    "gender",
    "religion"
  ];
  
  const statisticalPatterns = [
    /\d+(\.\d+)?%/,  // Percentage patterns
    /\d+ percent/,
    /\d+ out of \d+/,
    /increased by \d+/,
    /decreased by \d+/,
    /majority of/,
    /minority of/,
    /most of/
  ];
  
  // Check for strong claim indicators
  if (strongClaimIndicators.some(indicator => lowerText.includes(indicator))) {
    return true;
  }
  
  // Check for medium claim indicators combined with topical keywords
  for (const indicator of mediumClaimIndicators) {
    if (lowerText.includes(indicator)) {
      // If we find a medium indicator and a topic keyword, it's likely a claim
      if (topicalKeywords.some(keyword => lowerText.includes(keyword))) {
        return true;
      }
    }
  }
  
  // Check for statistical patterns which often indicate claims
  if (statisticalPatterns.some(pattern => pattern.test(lowerText))) {
    return true;
  }
  
  // Check sentence structure patterns that often indicate claims
  if (
    lowerText.includes("is") || 
    lowerText.includes("are") || 
    lowerText.includes("causes") ||
    lowerText.includes("leads to") ||
    lowerText.includes("results in") ||
    lowerText.startsWith("the fact is") ||
    lowerText.startsWith("the truth is") ||
    lowerText.startsWith("i know that")
  ) {
    // If these verbs/structures are present along with a controversial topic, likely a claim
    if (topicalKeywords.some(keyword => lowerText.includes(keyword))) {
      return true;
    }
  }
  
  // Additional detection for claims framed as questions
  if (
    (lowerText.startsWith("isn't it true that") ||
     lowerText.startsWith("don't you agree that") ||
     lowerText.startsWith("wouldn't you say that")) && 
    topicalKeywords.some(keyword => lowerText.includes(keyword))
  ) {
    return true;
  }
  
  // Not detected as a claim
  return false;
};
