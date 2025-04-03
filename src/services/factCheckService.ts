
import { Claim } from "@/context/DebateContext";
import { commonMyths } from "@/data/commonMyths";

// Expanded service to check facts using AI (Gemini API integration)
export const checkFactAgainstDatabase = async (claim: Claim) => {
  console.log("Checking fact:", claim.text);
  
  // First check against our local database for immediate responses
  // This serves as a fallback when AI is processing or for common myths
  const localMatch = checkAgainstLocalDatabase(claim);
  if (localMatch) {
    console.log("Found in local database");
    return localMatch;
  }
  
  // Use Gemini AI for fact checking
  return await geminiFactCheck(claim);
};

// Local database check (kept as fallback)
const checkAgainstLocalDatabase = (claim: Claim) => {
  const claimText = claim.text.toLowerCase();
  
  for (const myth of commonMyths) {
    if (claimText.includes(myth.claim.toLowerCase()) || 
        myth.claim.toLowerCase().includes(claimText)) {
      return {
        claimId: claim.id,
        verdict: myth.verdict as 'true' | 'false' | 'unverified',
        source: myth.source,
        explanation: myth.explanation,
        confidenceScore: myth.verdict === 'unverified' ? 50 : 90, // High confidence for database entries
        logicalFallacies: detectLogicalFallacies(claim.text),
        debunkedStudies: detectDebunkedStudies(claim.text)
      };
    }
  }
  
  return null;
};

// Gemini AI-powered fact checking function
const geminiFactCheck = async (claim: Claim) => {
  const claimText = claim.text;
  const topic = claim.topic || 'unknown';
  
  try {
    console.log("Gemini AI analyzing claim:", claimText);
    
    // Store API key in localStorage (in production, this should be handled server-side)
    const apiKey = localStorage.getItem("gemini-api-key");
    
    if (!apiKey) {
      console.warn("No Gemini API key found. Using fallback fact checking.");
      return fallbackFactCheck(claim);
    }
    
    // Enhanced prompt for Gemini - now includes research validity analysis
    const prompt = `
      Act as a professional fact-checker with expertise in ${topic}. Analyze this claim:
      
      "${claimText}"
      
      For your response, provide:
      1. Verdict: ONLY "true", "false", or "unverified"
      2. Explanation: Brief factual explanation supporting your verdict (2-3 sentences)
      3. Source: Relevant source or reference for the information
      4. Confidence: A number from 0-100 indicating your confidence level
      5. Knowledge Gaps: Mention any areas where scientific consensus is limited
      6. Alternative Perspective: A brief alternative viewpoint, if relevant
      7. Study Validity: If a specific study is mentioned, analyze if it has been debunked, retracted, or criticized by the scientific community
      8. Logical Fallacies: Identify any logical fallacies in the claim (e.g., correlation-causation errors, appeal to authority, cherry picking)
      
      Format your response as JSON:
      {
        "verdict": "true/false/unverified",
        "explanation": "Your explanation here",
        "source": "Your source here",
        "confidence": number,
        "knowledgeGaps": "Areas of limited consensus or knowledge here",
        "alternativePerspective": "Alternative perspective here",
        "debunkedStudies": "Information about study validity if applicable",
        "logicalFallacies": ["List any detected fallacies here"]
      }
      
      Focus on factual accuracy, research validity, and logical reasoning.
    `;
    
    // Make request to Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Gemini raw response:", data);
    
    // Extract the text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error("No text generated from Gemini");
    }
    
    // Try to parse the JSON response
    let parsedResponse: { 
      verdict: string; 
      explanation: string; 
      source: string;
      confidence?: number;
      knowledgeGaps?: string;
      alternativePerspective?: string;
      debunkedStudies?: string;
      logicalFallacies?: string[];
    };
    
    try {
      // Extract JSON from the text (it might be wrapped in code blocks or have extra text)
      const jsonMatch = generatedText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini JSON response:", parseError);
      
      // Basic parsing by looking for keywords if JSON parsing fails
      const verdict = generatedText.toLowerCase().includes("true") && !generatedText.toLowerCase().includes("false") 
        ? "true" 
        : generatedText.toLowerCase().includes("false") 
        ? "false" 
        : "unverified";
        
      const explanation = generatedText.substring(0, 200) + "...";
      
      parsedResponse = {
        verdict,
        explanation,
        source: "AI Analysis (text extraction)"
      };
    }
    
    // Validate and normalize the verdict
    let normalizedVerdict: 'true' | 'false' | 'unverified';
    if (parsedResponse.verdict.toLowerCase().includes("true")) {
      normalizedVerdict = 'true';
    } else if (parsedResponse.verdict.toLowerCase().includes("false")) {
      normalizedVerdict = 'false';
    } else {
      normalizedVerdict = 'unverified';
    }
    
    // Create alternative perspectives array if provided
    const alternativePerspectives = parsedResponse.alternativePerspective ? 
      [parsedResponse.alternativePerspective] : undefined;
    
    // Fallback to local detection if Gemini didn't identify logical fallacies
    const logicalFallacies = parsedResponse.logicalFallacies || detectLogicalFallacies(claim.text);
    
    // Ensure debunked studies are identified
    const debunkedStudies = parsedResponse.debunkedStudies || detectDebunkedStudies(claim.text);
    
    return {
      claimId: claim.id,
      verdict: normalizedVerdict,
      source: parsedResponse.source || "Google Gemini 2.0 Flash",
      explanation: parsedResponse.explanation || "This claim has been analyzed by AI.",
      confidenceScore: parsedResponse.confidence || generateConfidenceScore(normalizedVerdict),
      alternativePerspectives,
      logicalFallacies: logicalFallacies.length > 0 ? logicalFallacies : undefined,
      debunkedStudies: debunkedStudies ? debunkedStudies : undefined
    };
    
  } catch (error) {
    console.error("Error in Gemini fact check:", error);
    return fallbackFactCheck(claim);
  }
};

// Fallback fact checking when AI is unavailable
const fallbackFactCheck = async (claim: Claim) => {
  console.log("Using fallback fact checking for:", claim.text);
  
  // Use simplified versions of the existing functions
  const lowerClaimText = claim.text.toLowerCase();
  
  if (
    lowerClaimText.includes("vaccines cause autism") ||
    lowerClaimText.includes("5g causes") ||
    lowerClaimText.includes("flat earth") ||
    lowerClaimText.includes("climate change is a hoax") ||
    lowerClaimText.includes("moon landing was faked")
  ) {
    return {
      claimId: claim.id,
      verdict: 'false' as const,
      source: "Fallback fact checker",
      explanation: "This claim contradicts scientific consensus. (AI service unavailable, using fallback)",
      confidenceScore: 85,
      logicalFallacies: detectLogicalFallacies(claim.text),
      debunkedStudies: detectDebunkedStudies(claim.text)
    };
  }
  
  if (
    lowerClaimText.includes("vaccines are effective") ||
    lowerClaimText.includes("earth is round") ||
    lowerClaimText.includes("climate change is real") ||
    lowerClaimText.includes("smoking causes cancer") ||
    lowerClaimText.includes("humans walked on the moon")
  ) {
    return {
      claimId: claim.id,
      verdict: 'true' as const,
      source: "Fallback fact checker",
      explanation: "This claim is supported by scientific consensus. (AI service unavailable, using fallback)",
      confidenceScore: 90,
      logicalFallacies: detectLogicalFallacies(claim.text),
      debunkedStudies: detectDebunkedStudies(claim.text)
    };
  }
  
  return {
    claimId: claim.id,
    verdict: 'unverified' as const,
    source: "Fallback fact checker",
    explanation: "Unable to verify this claim. (AI service unavailable, using fallback)",
    confidenceScore: 40,
    logicalFallacies: detectLogicalFallacies(claim.text),
    debunkedStudies: detectDebunkedStudies(claim.text)
  };
};

// Enhanced logical fallacy detection
const detectLogicalFallacies = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const detectedFallacies: string[] = [];
  
  const fallacyPatterns: Record<string, RegExp[]> = {
    'Ad Hominem': [
      /attack.*person/i, /character.*not.*argument/i,
      /stupid/i, /idiot/i, /fool/i, /incompetent/i
    ],
    'Straw Man': [
      /no one.*saying/i, /nobody.*arguing/i,
      /that's not.*what.*said/i, /misrepresent/i
    ],
    'False Dilemma': [
      /either.*or/i, /black and white/i, 
      /only two options/i, /only two choices/i
    ],
    'Appeal to Authority': [
      /expert.*says/i, /according to.*authority/i,
      /scientist.*believe/i, /doctors.*agree/i
    ],
    'Slippery Slope': [
      /lead to/i, /next thing/i, /eventually/i,
      /first step/i, /domino effect/i
    ],
    'Post Hoc': [
      /because.*happened after/i, /followed by/i,
      /since.*then/i, /after.*therefore/i
    ],
    'Circular Reasoning': [
      /because it is/i, /true because.*true/i,
      /works because.*works/i
    ],
    'Hasty Generalization': [
      /all of them/i, /every single/i,
      /always.*never/i, /everyone knows/i
    ],
    'Correlation-Causation Fallacy': [
      /correlation/i, /correlate/i, /causation/i, /cause/i, 
      /because.*increased/i, /due to.*rise in/i,
      /leads to/i, /resulted from/i
    ],
    'Cherry Picking': [
      /one study/i, /single study/i, /one paper/i, /this study/i,
      /ignoring.*evidence/i, /despite other/i
    ],
    'Appeal to Nature': [
      /natural/i, /unnatural/i, /as nature intended/i,
      /the way things should be/i, /organic/i
    ],
    'Appeal to Emotion': [
      /think of the children/i, /imagine if/i,
      /don't you care about/i, /how would you feel if/i
    ],
    'Bandwagon Fallacy': [
      /everyone is doing it/i, /everyone knows/i, 
      /popular opinion/i, /most people/i
    ],
    'False Equivalence': [
      /just like/i, /same as/i, /equivalent to/i,
      /no different than/i, /equally/i
    ]
  };
  
  // Check each fallacy pattern
  for (const [fallacy, patterns] of Object.entries(fallacyPatterns)) {
    if (patterns.some(pattern => pattern.test(lowerText))) {
      // Special handling for correlation-causation
      if (fallacy === 'Correlation-Causation Fallacy') {
        // Only add if text suggests causation from correlation
        if (
          (lowerText.includes('correlation') && lowerText.includes('cause')) ||
          (lowerText.includes('because') && 
           (lowerText.includes('increased') || lowerText.includes('decreased'))) ||
          (lowerText.match(/([a-z]+)\s+causes\s+([a-z]+)/i) !== null)
        ) {
          detectedFallacies.push(fallacy);
        }
      } else {
        detectedFallacies.push(fallacy);
      }
    }
  }
  
  return detectedFallacies;
};

// New function to detect debunked or problematic studies
const detectDebunkedStudies = (text: string): string | undefined => {
  const lowerText = text.toLowerCase();
  
  // Database of known debunked/retracted studies
  const debunkedStudies = [
    {
      keywords: ['wakefield', 'mmr', 'autism', 'vaccine'],
      explanation: "The 1998 Andrew Wakefield study claiming a link between MMR vaccines and autism was retracted due to ethical violations and methodological problems. Multiple subsequent studies found no link between vaccines and autism."
    },
    {
      keywords: ['stanford prison experiment'],
      explanation: "The Stanford Prison Experiment has been criticized for experimenter bias, lack of scientific controls, and coaching of participants. Many of its conclusions about human behavior are now considered unreliable."
    },
    {
      keywords: ['ivermectin', 'covid', 'elgazzar'],
      explanation: "The Elgazzar study on ivermectin for COVID-19 was withdrawn due to ethical concerns and suspected data manipulation. Subsequent meta-analyses excluding this study showed no significant benefit."
    },
    {
      keywords: ['bem', 'precognition', 'feeling the future'],
      explanation: "Daryl Bem's 2011 study on precognition ('Feeling the Future') failed multiple replication attempts and is considered an example of p-hacking and methodological problems in psychological research."
    },
    {
      keywords: ['power pose', 'cuddy'],
      explanation: "The 'power pose' study by Amy Cuddy has failed replication attempts. The original finding that posture affects hormone levels and behavior is now considered overstated."
    },
    {
      keywords: ['reinhart', 'rogoff', 'growth', 'debt'],
      explanation: "The Reinhart-Rogoff study claiming high debt causes low economic growth contained spreadsheet errors and methodological issues. Reanalysis showed the relationship was much weaker than claimed."
    },
    {
      keywords: ['hydroxychloroquine', 'covid', 'raoult'],
      explanation: "Early studies by Didier Raoult on hydroxychloroquine for COVID-19 had serious methodological flaws. Larger, controlled studies found no benefit and potential harms."
    },
    {
      keywords: ['diets', 'saturated fat', 'ancel keys', 'seven countries'],
      explanation: "Ancel Keys' 'Seven Countries Study' on saturated fat has been criticized for cherry-picking countries that fit the hypothesis. Modern nutritional science shows a more complex relationship between fats and health."
    },
    {
      keywords: ['vaccines', 'mercury', 'thimerosal', 'autism'],
      explanation: "Studies claiming thimerosal in vaccines causes autism have been debunked. Multiple large epidemiological studies found no link, and thimerosal has been removed from childhood vaccines since 2001 with no effect on autism rates."
    },
    {
      keywords: ['gmo', 'séralini', 'rats', 'cancer'],
      explanation: "The Séralini study claiming GMOs caused tumors in rats was retracted due to small sample sizes and inappropriate statistical methods. The European Food Safety Authority and other organizations found numerous flaws in the research."
    }
  ];
  
  // Check if text mentions any known debunked studies
  for (const study of debunkedStudies) {
    // If text contains multiple keywords from a debunked study
    const matchCount = study.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matchCount >= 2) { // Text must match at least 2 keywords to reduce false positives
      return study.explanation;
    }
  }
  
  // Check for general red flags about studies
  if (
    (lowerText.includes('study') || lowerText.includes('research') || lowerText.includes('paper')) &&
    (lowerText.includes('proves') || lowerText.includes('proven') || lowerText.includes('conclusive'))
  ) {
    return "This claim references a study with absolute certainty. Scientific research rarely 'proves' anything conclusively, but rather provides evidence that supports or contradicts hypotheses.";
  }
  
  if (
    (lowerText.includes('one study') || lowerText.includes('single study') || lowerText.includes('a study shows')) &&
    !lowerText.includes('studies show')
  ) {
    return "This claim relies on a single study. Scientific consensus typically requires multiple studies with consistent results across different research teams.";
  }
  
  return undefined;
};

// Helper function to generate confidence scores when not provided by the API
const generateConfidenceScore = (verdict: 'true' | 'false' | 'unverified'): number => {
  if (verdict === 'unverified') {
    return Math.floor(Math.random() * 30) + 20; // 20-50%
  } else if (verdict === 'true') {
    return Math.floor(Math.random() * 20) + 75; // 75-95%
  } else {
    return Math.floor(Math.random() * 25) + 70; // 70-95%
  }
};
