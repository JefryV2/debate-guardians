import { TranscriptEntry } from "@/context/DebateContext";

// Emotion types for voice analysis
export type EmotionType = 'neutral' | 'angry' | 'happy' | 'sad' | 'frustrated' | 'excited' | 'uncertain';

// Words in common logical fallacies that might indicate problematic arguments
const fallacyKeywords = [
  'everyone knows', 'clearly', 'obviously', 'always', 'never',
  'expert said', 'studies show', 'research proves',
  'stupid', 'idiot', 'ignorant', 'ridiculous',
  'slippery slope', 'black and white', 'either or',
  'tradition', 'natural', 'appeal to', 'authority'
];

// Use the Web Speech API for real speech recognition
export const startSpeechRecognition = (
  speakerId: string,
  onTranscript: (text: string, isClaim: boolean) => void,
  onEmotionDetected?: (emotion: EmotionType) => void
) => {
  // Check browser support more thoroughly
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.error("Speech recognition is not supported in this browser.");
    onTranscript("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.", false);
    return () => {};
  }

  // Initialize speech recognition with better browser compatibility
  // @ts-ignore - TypeScript doesn't have built-in types for webkitSpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure recognition parameters
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  let finalTranscript = '';
  let interimTranscript = '';
  let lastTranscript = ''; // Track the previous transcript for context
  let contextBuffer = []; // Store recent statements for multi-sentence context
  let recognitionTimeout: number | null = null; // For handling pauses
  let recognitionRestartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 3;
  
  // For emotion analysis
  let audioContext: AudioContext | null = null;
  let analyzer: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let emotionAnalysisInterval: number | null = null;
  
  // For speech rate analysis
  let speechStartTime: number | null = null;
  let wordCount = 0;
  let speakingTooFast = false;
  
  recognition.onstart = () => {
    console.log("Speech recognition started successfully");
    recognitionRestartAttempts = 0;
    
    // Setup audio analysis for emotion detection if callback is provided
    if (onEmotionDetected) {
      setupEmotionDetection(onEmotionDetected);
    }
    
    // Reset speech rate tracking
    speechStartTime = null;
    wordCount = 0;
    speakingTooFast = false;
  };
  
  // Handle no speech errors by automatically restarting
  recognition.onnomatch = () => {
    console.log("No speech detected. Restarting recognition...");
    if (recognitionRestartAttempts < MAX_RESTART_ATTEMPTS) {
      recognitionRestartAttempts++;
      try {
        recognition.stop();
        setTimeout(() => recognition.start(), 300);
      } catch (e) {
        console.error("Error restarting speech recognition:", e);
        onTranscript("Error with speech recognition. Please try restarting the mic.", false);
      }
    } else {
      onTranscript("No speech detected after multiple attempts. Please check your microphone.", false);
    }
  };
  
  // Buffer multi-sentence context
  const addToContextBuffer = (text: string) => {
    contextBuffer.push(text);
    if (contextBuffer.length > 3) { // Keep last 3 statements for context
      contextBuffer.shift();
    }
  };
  
  // Helps handle mid-sentence pauses by delaying processing
  const scheduleTranscriptProcessing = (transcript: string) => {
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
    }
    
    recognitionTimeout = window.setTimeout(() => {
      const combinedContext = [...contextBuffer, transcript].join(' ');
      processFinalTranscript(transcript, speakerId, onTranscript, combinedContext);
      addToContextBuffer(transcript);
    }, 1500); // Wait 1.5 seconds after speech ends to process
  };
  
  recognition.onresult = (event: any) => {
    interimTranscript = '';
    
    // Track speech start time for rate calculation
    if (speechStartTime === null) {
      speechStartTime = performance.now();
    }
    
    // Find the last final result index
    let lastFinalIndex = -1;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        lastFinalIndex = i;
      }
    }
    
    // Collect the interim transcript
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        if (i === lastFinalIndex) {
          // This is the last final result in this batch
          finalTranscript = event.results[i][0].transcript;
          
          console.log("Final transcript:", finalTranscript);
          
          // Only process if the transcript has changed significantly
          if (finalTranscript.trim() && 
              levenshteinDistance(finalTranscript, lastTranscript) > finalTranscript.length * 0.3) {
            
            lastTranscript = finalTranscript;
            
            // Schedule processing with delay to catch pauses
            scheduleTranscriptProcessing(finalTranscript);
            
            // Calculate speaking rate
            const currentWords = finalTranscript.trim().split(/\s+/).length;
            wordCount += currentWords;
            
            const elapsedTimeInSeconds = (performance.now() - (speechStartTime || 0)) / 1000;
            const wordsPerMinute = Math.round((wordCount / elapsedTimeInSeconds) * 60);
            
            // Check if speaking too fast
            if (wordsPerMinute > 180 && !speakingTooFast) {
              speakingTooFast = true;
              console.log("Speaking too fast detected:", wordsPerMinute, "WPM");
            }
            
            // Reset for next speech segment
            speechStartTime = performance.now();
            wordCount = 0;
            speakingTooFast = false;
          }
        }
      } else {
        interimTranscript += event.results[i][0].transcript;
        // Log interim results for debugging
        console.log("Interim transcript:", interimTranscript);
      }
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error("Speech recognition error", event.error);
    
    // Handle common errors
    if (event.error === 'not-allowed') {
      onTranscript("Microphone access denied. Please enable microphone permissions in your browser settings.", false);
    } else if (event.error === 'network') {
      onTranscript("Network error occurred. Check your internet connection.", false);
      // Try to restart after network error
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart after network error:", e);
        }
      }, 3000);
    } else if (event.error === 'no-speech') {
      console.log("No speech detected, restarting recognition");
      // Don't show message, just restart
      try {
        recognition.stop();
        setTimeout(() => recognition.start(), 300);
      } catch (e) {
        console.error("Error restarting after no-speech:", e);
      }
    } else if (event.error === 'audio-capture') {
      onTranscript("No microphone was found or microphone is not working. Please check your device.", false);
    } else if (event.error === 'aborted') {
      console.log("Speech recognition was aborted");
    } else {
      onTranscript(`Speech recognition error: ${event.error}. Please try restarting the microphone.`, false);
    }
  };
  
  // Automatically restart if recognition ends unexpectedly
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
  
  // Start recognition with better error handling
  try {
    recognition.start();
    console.log("Recognition started");
  } catch (e) {
    console.error("Error starting speech recognition:", e);
    onTranscript("Failed to start speech recognition. Please refresh the page and try again.", false);
    return () => {};
  }
  
  // Return cleanup function with improved error handling
  return () => {
    try {
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
      }
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
  onTranscript: (text: string, isClaim: boolean) => void,
  context: string = ""
) => {
  // Only process non-empty statements
  if (text.trim()) {
    const isClaim = detectClaim(text, context);
    onTranscript(text, isClaim);
  }
};

// Enhanced claim detection with context awareness and better heuristics
export const detectClaim = (text: string, context: string = ""): boolean => {
  const lowerText = text.toLowerCase();
  const lowerContext = context.toLowerCase();
  
  // Don't flag very short statements as claims
  if (text.split(' ').length < 3) {
    return false;
  }
  
  // Check for question marks - questions are rarely claims
  // But account for rhetorical questions that are actually claims
  if (text.includes('?') && 
      !lowerText.startsWith("isn't it true") && 
      !lowerText.startsWith("don't you agree") &&
      !lowerText.startsWith("wouldn't you say")) {
    return false;
  }
  
  // Skip obvious commands and greetings
  if (
    lowerText.startsWith("please ") ||
    lowerText.startsWith("thank") ||
    lowerText.startsWith("hello") ||
    lowerText.startsWith("hi ") ||
    lowerText.startsWith("hey ") ||
    lowerText === "yes" ||
    lowerText === "no" ||
    lowerText === "ok" ||
    lowerText === "okay" ||
    lowerText === "sure" ||
    lowerText === "right"
  ) {
    return false;
  }
  
  // Improved categories of claim indicators with weighted importance
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
    "studies confirm",
    "i believe",
    "i think",
    "i'm certain",
    "i am sure",
    "i know",
    "in reality",
    "the truth is",
    "it's a fact",
    "in fact"
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
    "vast majority",
    "typically",
    "generally",
    "usually",
    "commonly",
    "as we all know",
    "history shows",
    "simply put",
    "basically"
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
    "religion",
    "tech",
    "technology",
    "artificial intelligence",
    "ai",
    "social media",
    "privacy",
    "data",
    "security",
    "energy",
    "fossil fuels",
    "renewable",
    "nuclear",
    "tax",
    "taxes",
    "spending",
    "debt",
    "policy",
    "regulation",
    "freedom",
    "rights",
    "research",
    "science",
    "money",
    "wealth",
    "poverty",
    "inequality"
  ];
  
  const statisticalPatterns = [
    /\d+(\.\d+)?%/,  // Percentage patterns
    /\d+ percent/,
    /\d+ out of \d+/,
    /increased by \d+/,
    /decreased by \d+/,
    /majority of/,
    /minority of/,
    /most of/,
    /many people/,
    /\d+ times/,
    /double/,
    /triple/,
    /\d+ million/,
    /\d+ billion/,
    /half of/,
    /\d+th percentile/
  ];
  
  // Check for sentence structure that indicates claims
  const claimStructures = [
    /^(the|this|that|these|those|it|they) (is|are|was|were) /i,
    /^(we|i) (know|believe|think) that /i,
    /^(studies|research|data|evidence|experts|scientists) (show|indicate|suggest|prove|confirm|demonstrate) /i,
    /^(according to|based on) /i,
    /^(in|throughout) (reality|fact|truth|practice) /i,
    /results in/i,
    /leads to/i,
    /causes/i,
    /prevents/i,
    /reduces/i,
    /increases/i
  ];

  // Factual comparison patterns
  const comparisonPatterns = [
    /better than/i,
    /worse than/i,
    /more than/i,
    /less than/i,
    /higher than/i,
    /lower than/i,
    /greater than/i,
    /superior to/i,
    /inferior to/i,
    /outperforms/i,
    /underperforms/i
  ];
  
  // Citation patterns that indicate claims
  const citationPatterns = [
    /published in/i,
    /wrote in/i,
    /cited in/i,
    /journal of/i,
    /paper by/i,
    /conducted by/i,
    /report from/i,
    /article in/i
  ];

  // Look for negation patterns that might indicate sarcasm or counter-arguments
  const negationPatterns = [
    /not true/i,
    /isn't real/i,
    /doesn't exist/i,
    /isn't actually/i,
    /don't really/i
  ];

  // Check for negations and sarcasm (might not be actual claims)
  if (negationPatterns.some(pattern => pattern.test(lowerText))) {
    // Only consider as claim if there's a strong indicator or a specific topic
    if (!strongClaimIndicators.some(indicator => lowerText.includes(indicator)) &&
        !topicalKeywords.some(keyword => lowerText.includes(keyword))) {
      return false;
    }
  }
  
  // Check for citations which strongly indicate claims
  if (citationPatterns.some(pattern => pattern.test(lowerText))) {
    return true;
  }
  
  // Check for strong claim indicators
  if (strongClaimIndicators.some(indicator => lowerText.includes(indicator))) {
    return true;
  }
  
  // Check for context linking phrases that might indicate a multi-sentence claim
  if (
    lowerText.startsWith("this means") ||
    lowerText.startsWith("that means") ||
    lowerText.startsWith("this shows") ||
    lowerText.startsWith("that shows") ||
    lowerText.startsWith("which means") ||
    lowerText.startsWith("therefore") ||
    lowerText.startsWith("thus") ||
    lowerText.startsWith("hence") ||
    lowerText.startsWith("consequently") ||
    lowerText.startsWith("as a result") ||
    lowerText.startsWith("this is why") ||
    lowerText.startsWith("this proves")
  ) {
    // Check if the context has a claim-like statement
    if (
      context.length > 0 &&
      (topicalKeywords.some(keyword => lowerContext.includes(keyword)) ||
      strongClaimIndicators.some(indicator => lowerContext.includes(indicator)))
    ) {
      return true;
    }
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
  
  // Check for claim sentence structures
  if (claimStructures.some(pattern => pattern.test(lowerText))) {
    // If the sentence follows a claim structure and has a controversial topic, likely a claim
    if (topicalKeywords.some(keyword => lowerText.includes(keyword))) {
      return true;
    }
  }
  
  // Check comparison patterns which often indicate claims
  if (comparisonPatterns.some(pattern => pattern.test(lowerText))) {
    // If comparison involves a topic, it's likely a claim
    if (topicalKeywords.some(keyword => lowerText.includes(keyword))) {
      return true;
    }
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
     lowerText.startsWith("wouldn't you say that") ||
     lowerText.startsWith("don't we all know that") ||
     lowerText.startsWith("couldn't we say that") ||
     lowerText.startsWith("isn't it obvious that")) && 
    topicalKeywords.some(keyword => lowerText.includes(keyword))
  ) {
    return true;
  }

  // Check for definitive statements with strong words
  const definitiveWords = ['proof', 'proven', 'conclude', 'conclusive', 'undeniable', 'undoubtedly'];
  if (definitiveWords.some(word => lowerText.includes(word))) {
    return true;
  }
  
  // Sentence length heuristic - longer sentences are more likely to be claims
  // but only if they contain topic keywords to avoid false positives on long opinions
  if (lowerText.split(' ').length > 15 && 
      topicalKeywords.some(keyword => lowerText.includes(keyword))) {
    // Check for opinion qualifiers that would make it not a claim
    const opinionQualifiers = ["feel like", "my opinion", "i feel", "i personally", "i prefer", "i like"];
    if (!opinionQualifiers.some(qualifier => lowerText.includes(qualifier))) {
      return true;
    }
  }
  
  // Not detected as a claim
  return false;
};

// Utility function to calculate text similarity (Levenshtein distance)
// This helps avoid duplicate processing of similar transcripts
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
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
