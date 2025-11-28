    // Type definitions for our hybrid fact-checking service
interface FactCheckResult {
  claimId: string;
  verdict: 'true' | 'false' | 'unverified';
  source: string;
  explanation: string;
  confidenceScore?: number;
  alternativePerspectives?: string[];
  logicalFallacies?: string[];
  debunkedStudies?: string;
  counterArgument?: string;
  sourcesChecked?: string[];
}

// Separate interface for ClaimBuster results
interface ClaimBusterResult {
  claimId: string;
  verdict: 'true' | 'false' | 'unverified' | 'not_claim';
  source: string;
  explanation: string;
  confidenceScore?: number;
}

// Configuration for different fact-checking modes
export type FactCheckMode = 'gemini' | 'hybrid' | 'claimbuster';

// Get tolerance level from localStorage or use default
const getToleranceLevel = (): number => {
  const storedTolerance = localStorage.getItem("debate-tolerance-level");
  return storedTolerance ? parseInt(storedTolerance, 10) : 15; // Default 15%
};

// Import the existing geminiFactCheck function
import { checkFactAgainstDatabase } from "./factCheckService";
import { Claim } from "@/context/DebateContext";

// Main hybrid fact-checking function
export const hybridFactCheck = async (claim: Claim, mode: FactCheckMode = 'hybrid'): Promise<any> => {
  console.log(`Checking fact using ${mode} mode:`, claim.text);
  
  switch (mode) {
    case 'gemini':
      return await checkFactAgainstDatabase(claim);
    case 'claimbuster':
      return await claimBusterOnlyFactCheck(claim);
    case 'hybrid':
    default:
      return await fullHybridFactCheck(claim);
  }
};

// ClaimBuster only mode - uses ClaimBuster for claim detection and basic analysis
const claimBusterOnlyFactCheck = async (claim: Claim): Promise<FactCheckResult> => {
  try {
    // Use ClaimBuster to detect if this is a factual claim worth checking
    const claimBusterResult: ClaimBusterResult = await claimBusterFactCheck(claim);
    
    // If ClaimBuster says this isn't a factual claim, return early
    if (claimBusterResult.verdict === 'not_claim') {
      return {
        claimId: claim.id,
        verdict: 'unverified',
        source: 'ClaimBuster Analysis',
        explanation: 'This statement was identified as an opinion or non-factual statement that does not require fact-checking.',
        confidenceScore: 80
      };
    }
    
    // For actual claims, use rule-based analysis
    const logicalFallacies = detectLogicalFallacies(claim.text);
    const debunkedStudies = detectDebunkedStudies(claim.text);
    
    // Check against common myths database
    const lowerClaimText = claim.text.toLowerCase();
    const obviouslyFalse = [
      'flat earth',
      'vaccines cause autism',
      '5g causes covid'
    ];
    
    for (const falseClaim of obviouslyFalse) {
      if (lowerClaimText.includes(falseClaim)) {
        return {
          claimId: claim.id,
          verdict: 'false',
          source: 'Rule-based Analysis',
          explanation: `This claim contradicts established scientific consensus.`,
          confidenceScore: 95,
          logicalFallacies,
          debunkedStudies: debunkedStudies ? debunkedStudies : undefined
        };
      }
    }
    
    // Check for obviously true claims
    const obviouslyTrue = [
      'smoking causes cancer',
      'climate change is real',
      'vaccines prevent disease'
    ];
    
    for (const trueClaim of obviouslyTrue) {
      if (lowerClaimText.includes(trueClaim)) {
        return {
          claimId: claim.id,
          verdict: 'true',
          source: 'Rule-based Analysis',
          explanation: `This claim is supported by scientific consensus.`,
          confidenceScore: 95,
          logicalFallacies,
          debunkedStudies: debunkedStudies ? debunkedStudies : undefined
        };
      }
    }
    
    // Return unverified for complex claims
    return {
      claimId: claim.id,
      verdict: 'unverified',
      source: 'Rule-based Analysis',
      explanation: `This claim requires further verification through expert analysis.`,
      confidenceScore: 60,
      logicalFallacies,
      debunkedStudies: debunkedStudies ? debunkedStudies : undefined,
      alternativePerspectives: [
        "More research is needed to verify this claim.",
        "Consult peer-reviewed sources for confirmation."
      ]
    };
  } catch (error) {
    console.error("Error in ClaimBuster-only fact check:", error);
    return fallbackFactCheck(claim);
  }
};

// Full hybrid approach combining all methods
const fullHybridFactCheck = async (claim: Claim): Promise<FactCheckResult> => {
  try {
    // Step 1: Use ClaimBuster to detect if this is a factual claim worth checking
    const claimBusterResult: ClaimBusterResult = await claimBusterFactCheck(claim);
    
    // If ClaimBuster says this isn't a factual claim, return early
    if (claimBusterResult.verdict === 'not_claim') {
      return {
        claimId: claim.id,
        verdict: 'unverified',
        source: 'ClaimBuster Analysis',
        explanation: 'This statement was identified as an opinion or non-factual statement that does not require fact-checking.',
        confidenceScore: 80
      };
    }
    
    // Step 2: Perform web search to gather evidence
    const searchResults = await performWebSearch(claim.text);
    
    // Step 3: Analyze source credibility
    const sourceAnalysis = await analyzeSourceCredibility(searchResults.sources);
    
    // Step 4: Check for debunked studies or problematic research
    const debunkedStudies = detectDebunkedStudies(claim.text);
    
    // Step 5: Detect logical fallacies
    const logicalFallacies = detectLogicalFallacies(claim.text);
    
    // Step 6: Use Gemini for final analysis if available
    const geminiApiKey = localStorage.getItem("gemini-api-key");
    if (geminiApiKey) {
      try {
        const geminiResult: FactCheckResult = await checkFactAgainstDatabase(claim) as FactCheckResult;
        return {
          ...geminiResult,
          sourcesChecked: searchResults.sources,
          logicalFallacies: logicalFallacies.length > 0 ? logicalFallacies : undefined,
          debunkedStudies: debunkedStudies ? debunkedStudies : undefined
        };
      } catch (error) {
        console.warn("Gemini check failed, using hybrid results:", error);
      }
    }
    
    // Step 7: Fallback to rule-based analysis
    return await ruleBasedAnalysis(claim, searchResults, sourceAnalysis, logicalFallacies, debunkedStudies);
    
  } catch (error) {
    console.error("Error in hybrid fact check:", error);
    return fallbackFactCheck(claim);
  }
};

// ClaimBuster integration for claim detection
const claimBusterFactCheck = async (claim: Claim): Promise<ClaimBusterResult> => {
  try {
    // In a real implementation, this would call the ClaimBuster API
    // For now, we'll simulate the behavior with our existing logic
    
    const claimText = claim.text.toLowerCase();
    
    // Simple heuristic to determine if something is a factual claim
    const isFactualClaim = 
      claimText.includes('study') || 
      claimText.includes('research') || 
      claimText.includes('according to') ||
      /\d+%/.test(claimText) ||
      claimText.includes('proves') ||
      claimText.includes('shows that');
    
    if (!isFactualClaim) {
      return {
        claimId: claim.id,
        verdict: 'not_claim',
        source: 'ClaimBuster Simulation',
        explanation: 'This statement was identified as an opinion or non-factual statement.',
        confidenceScore: 70
      };
    }
    
    // If it is a factual claim, proceed with verification
    return {
      claimId: claim.id,
      verdict: 'unverified',
      source: 'ClaimBuster Simulation',
      explanation: 'This statement was identified as a factual claim requiring verification.',
      confidenceScore: 90
    };
    
  } catch (error) {
    console.error("ClaimBuster check failed:", error);
    return {
      claimId: claim.id,
      verdict: 'unverified',
      source: 'ClaimBuster (Failed)',
      explanation: 'Unable to determine if this is a factual claim.',
      confidenceScore: 50
    };
  }
};

// Web search using Google and Bing APIs
const performWebSearch = async (query: string) => {
  // In a real implementation, this would call Google Custom Search API and Bing Search API
  // For now, we'll return simulated results
  
  return {
    results: [
      {
        title: "Relevant Article 1",
        url: "https://example.com/article1",
        snippet: "This article discusses the topic related to the claim...",
        source: "example.com"
      },
      {
        title: "Research Paper",
        url: "https://example.com/paper",
        snippet: "Scientific research on this subject shows...",
        source: "research.org"
      }
    ],
    sources: ["example.com", "research.org", "news.site"]
  };
};

// Source credibility analysis
const analyzeSourceCredibility = async (sources: string[]) => {
  // In a real implementation, this would check against databases of credible sources
  // For now, we'll return simulated analysis
  
  return sources.map(source => ({
    domain: source,
    credibility: Math.random() > 0.3 ? 'credible' : 'questionable',
    reason: Math.random() > 0.5 ? 'Peer-reviewed publication' : 'Potential bias detected'
  }));
};

// Rule-based analysis as fallback
const ruleBasedAnalysis = async (
  claim: Claim,
  searchResults: any,
  sourceAnalysis: any[],
  logicalFallacies: string[],
  debunkedStudies: string | undefined
): Promise<FactCheckResult> => {
  const claimText = claim.text.toLowerCase();
  
  // Check for obvious false claims
  const obviouslyFalse = [
    'flat earth',
    'vaccines cause autism',
    '5g causes covid'
  ];
  
  for (const falseClaim of obviouslyFalse) {
    if (claimText.includes(falseClaim)) {
      return {
        claimId: claim.id,
        verdict: 'false',
        source: 'Rule-based Analysis',
        explanation: `This claim contradicts established scientific consensus.`,
        confidenceScore: 95,
        logicalFallacies,
        debunkedStudies: debunkedStudies ? debunkedStudies : undefined,
        sourcesChecked: searchResults.sources
      };
    }
  }
  
  // Check for obviously true claims
  const obviouslyTrue = [
    'smoking causes cancer',
    'climate change is real',
    'vaccines prevent disease'
  ];
  
  for (const trueClaim of obviouslyTrue) {
    if (claimText.includes(trueClaim)) {
      return {
        claimId: claim.id,
        verdict: 'true',
        source: 'Rule-based Analysis',
        explanation: `This claim is supported by scientific consensus.`,
        confidenceScore: 95,
        logicalFallacies,
        debunkedStudies: debunkedStudies ? debunkedStudies : undefined,
        sourcesChecked: searchResults.sources
      };
    }
  }
  
  // Return unverified for complex claims requiring deeper analysis
  return {
    claimId: claim.id,
    verdict: 'unverified',
    source: 'Rule-based Analysis',
    explanation: `This claim requires further verification. ${searchResults.results.length} sources were checked.`,
    confidenceScore: 60,
    logicalFallacies,
    debunkedStudies: debunkedStudies ? debunkedStudies : undefined,
    sourcesChecked: searchResults.sources,
    alternativePerspectives: [
      "More research is needed to verify this claim.",
      "Consider consulting peer-reviewed sources for confirmation."
    ]
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
    ]
  };
  
  for (const [fallacy, patterns] of Object.entries(fallacyPatterns)) {
    if (patterns.some(pattern => pattern.test(lowerText))) {
      detectedFallacies.push(fallacy);
    }
  }
  
  return detectedFallacies;
};

// Enhanced function to detect debunked or problematic studies
const detectDebunkedStudies = (text: string): string | undefined => {
  const lowerText = text.toLowerCase();
  
  // Database of known debunked/retracted studies
  const debunkedStudies = [
    {
      keywords: ['wakefield', 'mmr', 'autism', 'vaccine'],
      explanation: "The 1998 Andrew Wakefield study claiming a link between MMR vaccines and autism was retracted due to ethical violations and methodological problems."
    },
    {
      keywords: ['ivermectin', 'covid', 'elgazzar'],
      explanation: "The Elgazzar study on ivermectin for COVID-19 was withdrawn due to ethical concerns and suspected data manipulation."
    }
  ];
  
  // Check if text mentions any known debunked studies
  for (const study of debunkedStudies) {
    const matchCount = study.keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matchCount >= 2) {
      return study.explanation;
    }
  }
  
  return undefined;
};

// Fallback fact checking when all else fails
const fallbackFactCheck = async (claim: Claim): Promise<FactCheckResult> => {
  console.log("Using fallback fact checking for:", claim.text);
  
  const lowerClaimText = claim.text.toLowerCase();
  
  if (
    lowerClaimText.includes("vaccines cause autism") ||
    lowerClaimText.includes("5g causes") ||
    lowerClaimText.includes("flat earth")
  ) {
    const logicalFallacies = detectLogicalFallacies(claim.text);
    return {
      claimId: claim.id,
      verdict: 'false',
      source: "Fallback fact checker",
      explanation: "This claim contradicts scientific consensus.",
      confidenceScore: 95,
      logicalFallacies
    };
  }
  
  return {
    claimId: claim.id,
    verdict: 'unverified',
    source: "Fallback fact checker",
    explanation: "Unable to verify this claim with current methods.",
    confidenceScore: 50,
    logicalFallacies: detectLogicalFallacies(claim.text)
  };
};