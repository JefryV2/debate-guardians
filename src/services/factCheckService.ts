import { Claim } from "@/context/DebateContext";
import { commonMyths } from "@/data/commonMyths";

// Get tolerance level from localStorage or use default
const getToleranceLevel = (): number => {
  const storedTolerance = localStorage.getItem("debate-tolerance-level");
  return storedTolerance ? parseInt(storedTolerance, 10) : 15; // Default 15%
};

// Expanded service to check facts using AI (Gemini API integration)
export const checkFactAgainstDatabase = async (claim: Claim) => {
  console.log("Checking fact:", claim.text);
  
  // First check against our local database for immediate responses
  // This serves as a fallback when AI is processing or for common myths
  const localMatch = checkAgainstLocalDatabase(claim);
  if (localMatch) {
    console.log("Found in local database");
    // Add counter argument if needed
    if (localMatch.verdict === 'false' || localMatch.logicalFallacies?.length > 0) {
      localMatch.counterArgument = generateCounterArgument(claim.text, localMatch);
    }
    return localMatch;
  }
  
  // Use Gemini AI for fact checking
  return await geminiFactCheck(claim);
};

// Local database check (kept as fallback)
const checkAgainstLocalDatabase = (claim: Claim) => {
  const claimText = claim.text.toLowerCase();
  const toleranceLevel = getToleranceLevel();
  
  for (const myth of commonMyths) {
    // Apply tolerance to numeric claims
    if (doesClaimMatchWithTolerance(claimText, myth.claim.toLowerCase(), toleranceLevel)) {
      return {
        claimId: claim.id,
        verdict: myth.verdict as 'true' | 'false' | 'unverified',
        source: myth.source,
        explanation: myth.explanation,
        confidenceScore: myth.verdict === 'unverified' ? 50 : 90, // High confidence for database entries
        logicalFallacies: detectLogicalFallacies(claim.text),
        debunkedStudies: detectDebunkedStudies(claim.text),
        counterArgument: generateCounterArgument(claim.text, {
          verdict: myth.verdict as 'true' | 'false' | 'unverified',
          explanation: myth.explanation,
          logicalFallacies: detectLogicalFallacies(claim.text)
        })
      };
    }
  }
  
  return null;
};

// New function to check if claims match with tolerance for numeric values
const doesClaimMatchWithTolerance = (claim1: string, claim2: string, tolerancePercent: number): boolean => {
  // Exact match check
  if (claim1.includes(claim2) || claim2.includes(claim1)) {
    return true;
  }
  
  // Extract numeric values from both claims
  const numbers1 = extractNumbers(claim1);
  const numbers2 = extractNumbers(claim2);
  
  if (numbers1.length === 0 || numbers2.length === 0) {
    return false;
  }
  
  // Check if any numbers in claim1 match any numbers in claim2 within tolerance
  for (const num1 of numbers1) {
    for (const num2 of numbers2) {
      const tolerance = (num2 * tolerancePercent) / 100;
      if (Math.abs(num1 - num2) <= tolerance) {
        return true;
      }
    }
  }
  
  return false;
};

// Extract numeric values from text
const extractNumbers = (text: string): number[] => {
  const numberMatches = text.match(/\d+(\.\d+)?/g);
  if (!numberMatches) return [];
  return numberMatches.map(n => parseFloat(n));
};

// Generate counter argument based on fact check and detected fallacies
const generateCounterArgument = (claimText: string, factCheck: {
  verdict: 'true' | 'false' | 'unverified',
  explanation?: string,
  logicalFallacies?: string[]
}): string => {
  if (factCheck.verdict === 'true') {
    return "";
  }
  
  let counterArgument = "";
  
  // Add fallacy-specific counter arguments
  if (factCheck.logicalFallacies && factCheck.logicalFallacies.length > 0) {
    const fallacy = factCheck.logicalFallacies[0];
    
    switch (fallacy) {
      case 'Correlation-Causation Fallacy':
        counterArgument = "Correlation doesn't imply causation. These events happening together doesn't prove one caused the other. We'd need controlled studies to establish causality.";
        break;
      case 'Cherry Picking':
        counterArgument = "This relies on selective evidence. We should consider the full body of research, not just individual studies that support a particular view.";
        break;
      case 'Appeal to Authority':
        counterArgument = "Expertise matters, but we should evaluate the evidence itself rather than accepting something solely based on who said it.";
        break;
      case 'Hasty Generalization':
        counterArgument = "This conclusion is drawn from too small a sample. We need more comprehensive data before making such broad claims.";
        break;
      case 'Straw Man':
        counterArgument = "This misrepresents the opposing position. Let's address what's actually being argued rather than an exaggerated version.";
        break;
      case 'False Dilemma':
        counterArgument = "This presents a false choice between only two options when there are likely more alternatives we should consider.";
        break;
      case 'Slippery Slope':
        counterArgument = "This assumes one event will inevitably lead to extreme consequences without evidence for such a chain reaction.";
        break;
      default:
        counterArgument = "This argument contains logical fallacies that weaken its conclusion. We should reconsider the evidence and reasoning.";
    }
  }
  // For false claims without specific fallacies
  else if (factCheck.verdict === 'false') {
    counterArgument = factCheck.explanation 
      ? `This claim is not supported by evidence. ${factCheck.explanation} A more accurate position would acknowledge these facts.`
      : "This claim contradicts established evidence. We should base our arguments on verified information rather than misconceptions.";
  }
  // For unverified claims
  else if (factCheck.verdict === 'unverified') {
    counterArgument = "This claim lacks sufficient evidence. We should acknowledge the uncertainty and avoid presenting it as established fact until more research is available.";
  }
  
  return counterArgument;
};

// Gemini AI-powered fact checking function
const geminiFactCheck = async (claim: Claim) => {
  const claimText = claim.text;
  const topic = claim.topic || 'unknown';
  const toleranceLevel = getToleranceLevel();
  
  try {
    console.log("Gemini AI analyzing claim:", claimText);
    
    // Store API key in localStorage (in production, this should be handled server-side)
    const apiKey = localStorage.getItem("gemini-api-key");
    
    if (!apiKey) {
      console.warn("No Gemini API key found. Using fallback fact checking.");
      return fallbackFactCheck(claim);
    }
    
    // Enhanced prompt for Gemini - now includes counter argument generation
    const prompt = `
      Act as a professional fact-checker with expertise in ${topic}. Analyze this claim:
      
      "${claimText}"
      
      Consider a tolerance level of ${toleranceLevel}% for numerical claims (e.g., if the claim mentions 80% but the actual figure is between ${80 - toleranceLevel}% and ${80 + toleranceLevel}%, consider it accurate enough).
      
      For your response, provide:
      1. Verdict: ONLY "true", "false", or "unverified"
      2. Explanation: Brief factual explanation supporting your verdict (2-3 sentences)
      3. Source: Relevant source or reference for the information
      4. Confidence: A number from 0-100 indicating your confidence level
      5. Knowledge Gaps: Mention any areas where scientific consensus is limited
      6. Alternative Perspective: A brief alternative viewpoint, if relevant
      7. Study Validity: If a specific study is mentioned, analyze if it has been debunked, retracted, or criticized by the scientific community
      8. Logical Fallacies: Identify any logical fallacies in the claim (e.g., correlation-causation errors, appeal to authority, cherry picking)
      9. Counter Argument: If the claim is false or contains fallacies, provide a constructive counter argument that could be used in a debate (2-3 sentences)
      
      Format your response as JSON:
      {
        "verdict": "true/false/unverified",
        "explanation": "Your explanation here",
        "source": "Your source here",
        "confidence": number,
        "knowledgeGaps": "Areas of limited consensus or knowledge here",
        "alternativePerspective": "Alternative perspective here",
        "debunkedStudies": "Information about study validity if applicable",
        "logicalFallacies": ["List any detected fallacies here"],
        "counterArgument": "Your counter argument here if applicable"
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
      counterArgument?: string;
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
    
    // Generate counter argument if Gemini didn't provide one
    const counterArgument = parsedResponse.counterArgument || 
      ((normalizedVerdict === 'false' || logicalFallacies.length > 0) ? 
        generateCounterArgument(claim.text, {
          verdict: normalizedVerdict,
          explanation: parsedResponse.explanation,
          logicalFallacies
        }) : 
        undefined);
    
    return {
      claimId: claim.id,
      verdict: normalizedVerdict,
      source: parsedResponse.source || "Google Gemini 2.0 Flash",
      explanation: parsedResponse.explanation || "This claim has been analyzed by AI.",
      confidenceScore: parsedResponse.confidence || generateConfidenceScore(normalizedVerdict),
      alternativePerspectives,
      logicalFallacies: logicalFallacies.length > 0 ? logicalFallacies : undefined,
      debunkedStudies: debunkedStudies ? debunkedStudies : undefined,
      counterArgument
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
    const logicalFallacies = detectLogicalFallacies(claim.text);
    const counterArgument = generateCounterArgument(claim.text, {
      verdict: 'false',
      explanation: "This claim contradicts scientific consensus.",
      logicalFallacies
    });
    
    return {
      claimId: claim.id,
      verdict: 'false' as const,
      source: "Fallback fact checker",
      explanation: "This claim contradicts scientific consensus. (AI service unavailable, using fallback)",
      confidenceScore: 85,
      logicalFallacies,
      debunkedStudies: detectDebunkedStudies(claim.text),
      counterArgument
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
  
  const logicalFallacies = detectLogicalFallacies(claim.text);
  return {
    claimId: claim.id,
    verdict: 'unverified' as const,
    source: "Fallback fact checker",
    explanation: "Unable to verify this claim. (AI service unavailable, using fallback)",
    confidenceScore: 40,
    logicalFallacies,
    debunkedStudies: detectDebunkedStudies(claim.text),
    counterArgument: logicalFallacies.length > 0 ? 
      generateCounterArgument(claim.text, { verdict: 'unverified', logicalFallacies }) : 
      undefined
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
