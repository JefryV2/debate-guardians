import { TranscriptEntry } from "@/context/DebateContext";

// Emotion types for voice analysis
export type EmotionType = 'neutral' | 'angry' | 'happy' | 'sad' | 'frustrated' | 'excited' | 'uncertain';

// Use the Web Speech API for real speech recognition
export const startSpeechRecognition = (
  speakerId: string,
  onTranscript: (text: string, isClaim: boolean) => void,
  onEmotionDetected?: (emotion: EmotionType) => void
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
  
  // For emotion analysis
  let audioContext: AudioContext | null = null;
  let analyzer: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let emotionAnalysisInterval: number | null = null;
  
  recognition.onstart = () => {
    console.log("Speech recognition started");
    
    // Setup audio analysis for emotion detection if callback is provided
    if (onEmotionDetected) {
      setupEmotionDetection(onEmotionDetected);
    }
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
    
    // Clean up emotion detection
    if (emotionAnalysisInterval) {
      window.clearInterval(emotionAnalysisInterval);
      emotionAnalysisInterval = null;
    }
    
    if (microphone) {
      microphone.disconnect();
      microphone = null;
    }
    
    if (audioContext) {
      audioContext.close().catch(console.error);
      audioContext = null;
    }
  };
  
  // Setup emotion detection through audio analysis
  const setupEmotionDetection = async (onEmotionDetected: (emotion: EmotionType) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContext = new AudioContext();
      analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyzer);
      
      // Analyze audio data periodically to detect emotion
      emotionAnalysisInterval = window.setInterval(() => {
        if (analyzer) {
          const bufferLength = analyzer.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyzer.getByteFrequencyData(dataArray);
          
          const emotion = analyzeVoiceEmotion(dataArray);
          onEmotionDetected(emotion);
        }
      }, 500); // Check every 500ms
      
    } catch (error) {
      console.error("Error setting up emotion detection:", error);
    }
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
      
      // Clean up emotion detection
      if (emotionAnalysisInterval) {
        window.clearInterval(emotionAnalysisInterval);
      }
      
      if (microphone) {
        microphone.disconnect();
      }
      
      if (audioContext) {
        audioContext.close().catch(console.error);
      }
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

// Analyze audio data to detect emotion
// This is a simplified approach - in production, you would use a trained ML model
const analyzeVoiceEmotion = (audioData: Uint8Array): EmotionType => {
  // Calculate audio features
  const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
  const max = Math.max(...Array.from(audioData));
  const variability = calculateVariability(audioData);
  
  // Simple rule-based emotion detection
  // In a real implementation, this would use a proper ML model
  if (max > 220 && variability > 50) {
    return 'angry'; // High volume and high variability often indicates anger
  } else if (max > 200 && variability > 40) {
    return 'excited'; // High volume but less variability might be excitement
  } else if (max > 180 && variability < 30) {
    return 'happy'; // Moderate volume, low variability might indicate happiness
  } else if (max < 130 && variability < 20) {
    return 'sad'; // Low volume, low variability often indicates sadness
  } else if (variability > 40 && average < 150) {
    return 'frustrated'; // High variability but moderate volume might be frustration
  } else if (variability > 30 && average < 120) {
    return 'uncertain'; // Some variability but lower volume might be uncertainty
  }
  
  return 'neutral'; // Default
};

// Calculate variability in the audio data
const calculateVariability = (audioData: Uint8Array): number => {
  const values = Array.from(audioData);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / squaredDiffs.length;
  
  return Math.sqrt(variance); // Standard deviation
};
