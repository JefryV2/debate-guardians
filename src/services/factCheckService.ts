
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

// Local database check (kept as fallback) - fixed to prevent cross-claim matching
const checkAgainstLocalDatabase = (claim: Claim) => {
  const claimText = claim.text.toLowerCase();
  const toleranceLevel = getToleranceLevel();
  
  // Create a unique identifier for this claim to prevent cross-matching
  const claimId = claim.id;
  
  // Add claim context tracking to prevent cross-claim matching
  const claimContext = extractTopicContext(claimText);
  
  for (const myth of commonMyths) {
    const mythText = myth.claim.toLowerCase();
    const mythContext = extractTopicContext(mythText);
    
    // Only match if contexts are compatible - prevents COVID claims matching with unrelated topics
    if (!areContextsCompatible(claimContext, mythContext)) {
      continue;
    }
    
    // Apply tolerance to numeric claims with added context verification
    if (doesClaimMatchWithTolerance(claimText, mythText, toleranceLevel)) {
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

// Extract topic context from text to prevent cross-topic matching
const extractTopicContext = (text: string): string[] => {
  const contexts: string[] = [];
  
  // Define context categories - expanded with more keywords
  const contextMap: Record<string, string[]> = {
    'covid': ['covid', 'coronavirus', 'pandemic', 'lockdown', 'mask', 'vaccine', 'pfizer', 'moderna', 
              'social distancing', 'quarantine', 'pcr', 'wuhan', 'delta', 'omicron', 'sars-cov-2'],
    'climate': ['climate', 'global warming', 'carbon', 'emissions', 'temperature', 'greenhouse', 
               'renewable', 'fossil fuel', 'sea level', 'ice cap', 'climate change', 'sustainability'],
    'politics': ['election', 'democracy', 'republican', 'democrat', 'president', 'vote', 'congress', 
                'senate', 'legislation', 'parliament', 'political', 'government', 'policy'],
    'health': ['health', 'medicine', 'treatment', 'disease', 'doctor', 'patient', 'hospital', 'cure',
              'symptom', 'diagnosis', 'pharmaceutical', 'immune', 'nutrition', 'obesity'],
    'science': ['science', 'research', 'study', 'scientist', 'experiment', 'data', 'theory', 'hypothesis',
               'laboratory', 'peer review', 'publication', 'journal', 'evidence', 'empirical'],
    'economics': ['economy', 'inflation', 'market', 'investment', 'stock', 'recession', 'gdp', 'trade',
                 'unemployment', 'federal reserve', 'fiscal', 'monetary', 'economic growth'],
    'education': ['education', 'school', 'student', 'teacher', 'classroom', 'curriculum', 'university',
                 'college', 'degree', 'learning', 'academic', 'educational', 'pedagogy'],
    'technology': ['technology', 'computer', 'internet', 'digital', 'ai', 'artificial intelligence',
                  'algorithm', 'software', 'hardware', 'tech', 'innovation', 'automation']
  };
  
  // Check which contexts apply to this text
  for (const [context, keywords] of Object.entries(contextMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      contexts.push(context);
    }
  }
  
  return contexts;
};

// Check if contexts are compatible to avoid cross-topic matching
const areContextsCompatible = (context1: string[], context2: string[]): boolean => {
  // If either has no specific context, they can match with anything
  if (context1.length === 0 || context2.length === 0) {
    return true;
  }
  
  // Must have at least one context in common
  return context1.some(c => context2.includes(c));
};

// New function to check if claims match with tolerance for numeric values
const doesClaimMatchWithTolerance = (claim1: string, claim2: string, tolerancePercent: number): boolean => {
  // Exact match check with improved partial matching
  if (claim1.includes(claim2) || claim2.includes(claim1)) {
    return true;
  }
  
  // Extract key phrases (2-5 word sequences) and check for matches
  const claim1Phrases = extractKeyPhrases(claim1);
  const claim2Phrases = extractKeyPhrases(claim2);
  
  // Calculate phrase overlap percentage
  const matchingPhrases = claim1Phrases.filter(phrase => 
    claim2Phrases.some(p2 => p2.includes(phrase) || phrase.includes(p2))
  );
  
  // If there's a significant phrase overlap (adjusted threshold)
  if (matchingPhrases.length > 0 && 
      matchingPhrases.length / Math.min(claim1Phrases.length, claim2Phrases.length) > 0.25) {
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
        // Only return true if the surrounding context is similar
        const num1Context = getNumberContext(claim1, num1);
        const num2Context = getNumberContext(claim2, num2);
        
        if (areContextsSimilar(num1Context, num2Context)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Extract key phrases to improve matching
const extractKeyPhrases = (text: string): string[] => {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i+1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  return phrases;
};

// Get context around a number for more accurate matching
const getNumberContext = (text: string, number: number): string => {
  const numberStr = number.toString();
  const index = text.indexOf(numberStr);
  if (index === -1) return "";
  
  // Get 3 words before and after the number
  const words = text.split(/\s+/);
  const numberWordIndex = words.findIndex(word => word.includes(numberStr));
  
  if (numberWordIndex === -1) return "";
  
  const startIndex = Math.max(0, numberWordIndex - 3);
  const endIndex = Math.min(words.length - 1, numberWordIndex + 3);
  
  return words.slice(startIndex, endIndex + 1).join(' ');
};

// Check if number contexts are similar enough for a match
const areContextsSimilar = (context1: string, context2: string): boolean => {
  if (!context1 || !context2) return false;
  
  const words1 = new Set(context1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(context2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  let matchCount = 0;
  for (const word of words1) {
    if (words2.has(word)) matchCount++;
  }
  
  // Need at least one significant word in common besides the number itself
  return matchCount > 0;
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
  // For unverified claims - modified to be less harsh
  else if (factCheck.verdict === 'unverified') {
    counterArgument = "This claim requires further verification. While it's not necessarily false, additional research or context would help evaluate its accuracy.";
  }
  
  return counterArgument;
};

// Gemini AI-powered fact checking function - enhanced for better study detection
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
    
    // Enhanced prompt for Gemini - improved for better study/research assessment
    const prompt = `
      Act as a professional fact-checker with expertise in ${topic}. Analyze this claim:
      
      "${claimText}"
      
      Consider a tolerance level of ${toleranceLevel}% for numerical claims (e.g., if the claim mentions 80% but the actual figure is between ${80 - toleranceLevel}% and ${80 + toleranceLevel}%, consider it accurate enough).
      
      For your response, provide:
      1. Verdict: ONLY "true", "false", or "unverified" (use "unverified" when claim needs further verification rather than being outright false)
      2. Explanation: Brief factual explanation supporting your verdict (2-3 sentences)
      3. Source: Relevant source or reference for the information
      4. Confidence: A number from 0-100 indicating your confidence level
      5. Knowledge Gaps: Mention any areas where scientific consensus is limited
      6. Alternative Perspective: A brief alternative viewpoint, if relevant
      7. Study Validity: If a specific study is mentioned, thoroughly analyze if it has been debunked, retracted, criticized by the scientific community, or has methodological issues
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
    
    // Ensure debunked studies are identified - using enhanced detection
    const debunkedStudies = parsedResponse.debunkedStudies || detectDebunkedStudies(claim.text);
    
    // Generate counter argument if Gemini didn't provide one - using less harsh language for unverified claims
    const counterArgument = parsedResponse.counterArgument || 
      ((normalizedVerdict === 'false' || logicalFallacies.length > 0) ? 
        generateCounterArgument(claim.text, {
          verdict: normalizedVerdict,
          explanation: parsedResponse.explanation,
          logicalFallacies
        }) : 
        undefined);
    
    // Calculate adjusted confidence score based on verdict
    const confidenceScore = parsedResponse.confidence || 
      generateConfidenceScore(normalizedVerdict, !!debunkedStudies, logicalFallacies.length > 0);
    
    return {
      claimId: claim.id,
      verdict: normalizedVerdict,
      source: parsedResponse.source || "Google Gemini 2.0 Flash",
      explanation: parsedResponse.explanation || "This claim has been analyzed by AI.",
      confidenceScore,
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
    confidenceScore: 50, // Increased from 40 to be less penalizing
    logicalFallacies,
    debunkedStudies: detectDebunkedStudies(claim.text),
    counterArgument: logicalFallacies.length > 0 ? 
      generateCounterArgument(claim.text, { verdict: 'unverified', logicalFallacies }) : 
      undefined
  };
};

// Enhanced logical fallacy detection with more comprehensive patterns
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

// Enhanced function to detect debunked or problematic studies with more comprehensive database
const detectDebunkedStudies = (text: string): string | undefined => {
  const lowerText = text.toLowerCase();
  
  // Expanded database of known debunked/retracted studies with more context
  const debunkedStudies = [
    {
      keywords: ['wakefield', 'mmr', 'autism', 'vaccine'],
      explanation: "The 1998 Andrew Wakefield study claiming a link between MMR vaccines and autism was retracted due to ethical violations and methodological problems. Multiple subsequent studies found no link between vaccines and autism."
    },
    {
      keywords: ['stanford prison experiment', 'zimbardo'],
      explanation: "The Stanford Prison Experiment has been criticized for experimenter bias, lack of scientific controls, and coaching of participants. Many of its conclusions about human behavior are now considered unreliable."
    },
    {
      keywords: ['ivermectin', 'covid', 'elgazzar'],
      explanation: "The Elgazzar study on ivermectin for COVID-19 was withdrawn due to ethical concerns and suspected data manipulation. Subsequent meta-analyses excluding this study showed no significant benefit."
    },
    {
      keywords: ['bem', 'precognition', 'feeling the future', 'esp'],
      explanation: "Daryl Bem's 2011 study on precognition ('Feeling the Future') failed multiple replication attempts and is considered an example of p-hacking and methodological problems in psychological research."
    },
    {
      keywords: ['power pose', 'cuddy', 'body language'],
      explanation: "The 'power pose' study by Amy Cuddy has failed replication attempts. The original finding that posture affects hormone levels and behavior is now considered overstated."
    },
    {
      keywords: ['reinhart', 'rogoff', 'growth', 'debt', 'excel'],
      explanation: "The Reinhart-Rogoff study claiming high debt causes low economic growth contained spreadsheet errors and methodological issues. Reanalysis showed the relationship was much weaker than claimed."
    },
    {
      keywords: ['hydroxychloroquine', 'covid', 'raoult', 'hcq'],
      explanation: "Early studies by Didier Raoult on hydroxychloroquine for COVID-19 had serious methodological flaws. Larger, controlled studies found no benefit and potential harms."
    },
    {
      keywords: ['diets', 'saturated fat', 'ancel keys', 'seven countries', 'heart disease'],
      explanation: "Ancel Keys' 'Seven Countries Study' on saturated fat has been criticized for cherry-picking countries that fit the hypothesis. Modern nutritional science shows a more complex relationship between fats and health."
    },
    {
      keywords: ['vaccines', 'mercury', 'thimerosal', 'autism'],
      explanation: "Studies claiming thimerosal in vaccines causes autism have been debunked. Multiple large epidemiological studies found no link, and thimerosal has been removed from childhood vaccines since 2001 with no effect on autism rates."
    },
    {
      keywords: ['gmo', 'séralini', 'rats', 'cancer', 'monsanto'],
      explanation: "The Séralini study claiming GMOs caused tumors in rats was retracted due to small sample sizes and inappropriate statistical methods. The European Food Safety Authority and other organizations found numerous flaws in the research."
    },
    {
      keywords: ['wansink', 'food', 'behavior', 'cornell'],
      explanation: "Brian Wansink's food behavior studies at Cornell were found to contain numerous statistical inconsistencies and p-hacking. Multiple papers were retracted due to manipulation of data and questionable research practices."
    },
    {
      keywords: ['bem-lommel', 'near-death', 'consciousness', 'afterlife'],
      explanation: "The Pim van Lommel study on near-death experiences has methodological limitations and makes claims beyond what the data supports regarding consciousness existing independently of the brain."
    },
    {
      keywords: ['lsd', 'chromosome', 'dna damage'],
      explanation: "Studies from the 1960s claiming LSD damages chromosomes were methodologically flawed and could not be replicated. Later research did not find evidence of DNA damage at typical doses."
    },
    {
      keywords: ['facilitated communication', 'autism', 'typing'],
      explanation: "Studies on facilitated communication for non-verbal individuals claimed to enable communication, but controlled studies showed facilitators were unconsciously guiding responses. Scientific consensus is that it is not a valid technique."
    },
    {
      keywords: ['vaccines', '2018', 'dtp', 'mortality', 'mogensen'],
      explanation: "The Mogensen et al. study claiming DTP vaccine increases overall mortality in Africa had serious methodological flaws including selection bias and missing data. Multiple systematic reviews found no evidence for increased mortality."
    },
    {
      keywords: ['wegman', 'climate', 'hockey stick', 'mcintyre'],
      explanation: "The Wegman report criticizing climate change research contained plagiarized content and statistical errors. Subsequent independent analyses confirmed the original 'hockey stick' climate findings."
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
  
  // Enhanced check for general red flags about studies
  if (
    (lowerText.includes('study') || lowerText.includes('research') || lowerText.includes('paper')) &&
    (lowerText.includes('proves') || lowerText.includes('proven') || lowerText.includes('conclusive'))
  ) {
    return "This claim references a study with absolute certainty. Scientific research rarely 'proves' anything conclusively, but rather provides evidence that supports or contradicts hypotheses.";
  }
  
  if (
    (lowerText.includes('one study') || lowerText.includes('single study') || lowerText.includes('a study shows')) &&
    !lowerText.includes('studies show') &&
    !lowerText.includes('systematic review') &&
    !lowerText.includes('meta-analysis')
  ) {
    return "This claim relies on a single study. Scientific consensus typically requires multiple studies with consistent results across different research teams.";
  }
  
  if (
    (lowerText.includes('study') || lowerText.includes('research')) &&
    (lowerText.includes('small sample') || lowerText.includes('preliminary') || 
     lowerText.includes('pilot') || lowerText.includes('not peer reviewed'))
  ) {
    return "This claim cites preliminary research or a study with limitations. Such findings are typically considered tentative until verified by larger, more rigorous studies.";
  }
  
  if (
    lowerText.includes('published in') &&
    (lowerText.includes('predatory') || lowerText.includes('pay-to-publish') ||
     lowerText.includes('medical hypothesis') || lowerText.includes('non-peer-reviewed'))
  ) {
    return "This claim references research from a potentially questionable publication source. Studies should be evaluated based on methodological rigor and peer review process.";
  }
  
  return undefined;
};

// Helper function to generate confidence scores when not provided by the API
// Enhanced to be less harsh on unverified claims and consider study validity
const generateConfidenceScore = (
  verdict: 'true' | 'false' | 'unverified', 
  hasDebunkedStudy: boolean = false,
  hasFallacies: boolean = false
): number => {
  let baseScore: number;
  
  if (verdict === 'unverified') {
    // More nuanced scoring for unverified claims - higher baseline
    baseScore = Math.floor(Math.random() * 20) + 40; // 40-60% instead of 20-50%
  } else if (verdict === 'true') {
    baseScore = Math.floor(Math.random() * 20) + 75; // 75-95%
  } else {
    baseScore = Math.floor(Math.random() * 25) + 70; // 70-95%
  }
  
  // Adjust score based on presence of debunked studies or fallacies
  if (hasDebunkedStudy) {
    baseScore = Math.max(baseScore - 15, 30); // Reduce score but don't go below 30%
  }
  
  if (hasFallacies) {
    baseScore = Math.max(baseScore - 10, 30); // Reduce score but don't go below 30%
  }
  
  return baseScore;
};

