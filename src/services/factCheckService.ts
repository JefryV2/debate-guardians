
import { Claim } from "@/context/DebateContext";
import { commonMyths } from "@/data/commonMyths";

// Function to check facts using AI (simulated in this MVP)
export const checkFactAgainstDatabase = async (claim: Claim) => {
  console.log("Checking fact:", claim.text);
  
  // First check against our local database for immediate responses
  // This serves as a fallback when AI is processing or for common myths
  const localMatch = checkAgainstLocalDatabase(claim);
  if (localMatch) {
    console.log("Found in local database");
    return localMatch;
  }
  
  // Simulate AI processing with a more sophisticated fact-checking approach
  return await aiFactCheck(claim);
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
        explanation: myth.explanation
      };
    }
  }
  
  return null;
};

// AI-powered fact checking function
const aiFactCheck = async (claim: Claim) => {
  const claimText = claim.text;
  
  // In a production app, this would call an AI service API
  // For this MVP, we'll simulate AI responses with a more sophisticated algorithm
  
  try {
    console.log("AI analyzing claim:", claimText);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Advanced heuristics for better claim analysis
    // Looking for specific patterns in the claims
    const lowerClaimText = claimText.toLowerCase();
    
    // Check for scientifically disputed claims
    if (containsScientificClaim(lowerClaimText)) {
      if (isLikelyFalseScientificClaim(lowerClaimText)) {
        return generateFalseResponse(claim.id, lowerClaimText);
      } else if (isLikelyTrueScientificClaim(lowerClaimText)) {
        return generateTrueResponse(claim.id, lowerClaimText);
      }
    }
    
    // Check for statistical claims
    if (containsStatisticalClaim(lowerClaimText)) {
      if (isLikelyFalseStatisticalClaim(lowerClaimText)) {
        return generateFalseResponse(claim.id, lowerClaimText);
      } else if (isLikelyTrueStatisticalClaim(lowerClaimText)) {
        return generateTrueResponse(claim.id, lowerClaimText);
      }
    }
    
    // Check for historical claims
    if (containsHistoricalClaim(lowerClaimText)) {
      if (isLikelyFalseHistoricalClaim(lowerClaimText)) {
        return generateFalseResponse(claim.id, lowerClaimText);
      } else if (isLikelyTrueHistoricalClaim(lowerClaimText)) {
        return generateTrueResponse(claim.id, lowerClaimText);
      }
    }
    
    // Default response for claims we can't confidently assess
    return {
      claimId: claim.id,
      verdict: 'unverified' as const,
      source: "AI Analysis",
      explanation: "This claim requires additional verification. While the AI has analyzed available information, it cannot make a definitive determination based on current data."
    };
    
  } catch (error) {
    console.error("Error in AI fact check:", error);
    return {
      claimId: claim.id,
      verdict: 'unverified' as const,
      source: "Error in AI processing",
      explanation: "There was an error processing this claim. It requires manual verification."
    };
  }
};

// Helper functions for AI analysis
const containsScientificClaim = (text: string): boolean => {
  const scientificIndicators = [
    "studies show", "research indicates", "scientists", "experiment", 
    "evidence", "proven", "discovered", "journal", "peer-reviewed",
    "clinical trials", "laboratory", "medicine shows", "science has established"
  ];
  return scientificIndicators.some(indicator => text.includes(indicator));
};

const containsStatisticalClaim = (text: string): boolean => {
  const statisticalIndicators = [
    "percent", "statistics", "survey", "poll", "majority", 
    "increased by", "decreased by", "rate of", "number of",
    "most people", "census shows", "data indicates", "%"
  ];
  return statisticalIndicators.some(indicator => text.includes(indicator));
};

const containsHistoricalClaim = (text: string): boolean => {
  const historicalIndicators = [
    "history", "in the past", "historically", "ancient", "century",
    "years ago", "decade", "during the", "before the", "after the",
    "founded", "established", "invented", "discovered", "president"
  ];
  return historicalIndicators.some(indicator => text.includes(indicator));
};

// These functions simulate the AI's analysis capabilities
const isLikelyFalseScientificClaim = (text: string): boolean => {
  const commonFalseClaims = [
    "vaccines cause autism",
    "5g causes",
    "causes cancer",
    "miracle cure",
    "cures all",
    "proven to heal",
    "toxins",
    "chemtrails",
    "flat earth",
    "evolution is just a theory",
    "gmos are dangerous",
    "climate change is a hoax",
    "natural remedy that doctors don't want you to know"
  ];
  return commonFalseClaims.some(claim => text.includes(claim));
};

const isLikelyTrueScientificClaim = (text: string): boolean => {
  const commonTrueClaims = [
    "vaccines are effective",
    "earth is round",
    "climate change is real",
    "evolution is supported by evidence",
    "antibiotics don't work on viruses",
    "washing hands prevents disease",
    "smoking causes cancer",
    "exercise is beneficial",
    "vitamins are essential"
  ];
  return commonTrueClaims.some(claim => text.includes(claim));
};

const isLikelyFalseStatisticalClaim = (text: string): boolean => {
  const commonFalseClaims = [
    "99 percent of people",
    "vast majority of scientists disagree",
    "crime is increasing everywhere",
    "immigrants cause most crime",
    "most people believe",
    "almost all experts agree that vaccines are dangerous"
  ];
  return commonFalseClaims.some(claim => text.includes(claim));
};

const isLikelyTrueStatisticalClaim = (text: string): boolean => {
  const commonTrueClaims = [
    "majority of scientists agree on climate change",
    "vaccination reduces disease rates",
    "smoking rates have declined",
    "literacy rates have improved",
    "life expectancy has increased"
  ];
  return commonTrueClaims.some(claim => text.includes(claim));
};

const isLikelyFalseHistoricalClaim = (text: string): boolean => {
  const commonFalseClaims = [
    "moon landing was faked",
    "pyramids were built by aliens",
    "columbus discovered that the earth was round",
    "medieval people thought the earth was flat",
    "einstein failed math",
    "napoleon was short"
  ];
  return commonFalseClaims.some(claim => text.includes(claim));
};

const isLikelyTrueHistoricalClaim = (text: string): boolean => {
  const commonTrueClaims = [
    "world war ii ended in 1945",
    "united states declared independence in 1776",
    "berlin wall fell in 1989",
    "wright brothers flew the first airplane",
    "apollo 11 landed on the moon",
    "einstein developed the theory of relativity"
  ];
  return commonTrueClaims.some(claim => text.includes(claim));
};

const generateFalseResponse = (claimId: string, text: string) => {
  // Generate appropriate responses based on claim type
  let explanation = "This claim is not supported by scientific evidence.";
  let source = "AI Fact Check System";
  
  if (text.includes("vaccine") && text.includes("autism")) {
    explanation = "Multiple large-scale studies have found no link between vaccines and autism. This claim has been thoroughly debunked by medical research.";
    source = "CDC, WHO, and multiple peer-reviewed studies";
  } else if (text.includes("climate change is a hoax")) {
    explanation = "Climate change is supported by overwhelming scientific evidence from multiple independent sources. Over 97% of climate scientists agree that human-caused climate change is occurring.";
    source = "NASA, NOAA, IPCC, and scientific consensus";
  } else if (text.includes("flat earth")) {
    explanation = "The Earth has been proven to be spherical through multiple lines of evidence including satellite imagery, physics observations, and direct circumnavigation.";
    source = "NASA, physics principles, and direct observation";
  } else if (text.includes("moon landing was faked")) {
    explanation = "The moon landings have been verified through multiple independent sources, including retroreflectors left on the moon that scientists continue to use today.";
    source = "NASA, independent astronomers, and physical evidence";
  } else if (text.includes("5g causes")) {
    explanation = "Multiple scientific studies have found no evidence that 5G technology causes health problems. 5G radio waves are non-ionizing and don't damage DNA.";
    source = "WHO, FCC, and scientific research";
  } else if (text.includes("gmo") && (text.includes("dangerous") || text.includes("harmful"))) {
    explanation = "The scientific consensus is that currently approved GMO foods are safe for consumption. No evidence of harm has been found in extensive studies.";
    source = "FDA, WHO, American Medical Association";
  }
  
  return {
    claimId,
    verdict: 'false' as const,
    source,
    explanation
  };
};

const generateTrueResponse = (claimId: string, text: string) => {
  let explanation = "This claim is supported by scientific evidence.";
  let source = "AI Fact Check System based on scientific literature";
  
  if (text.includes("vaccines are effective")) {
    explanation = "Vaccines have been proven effective at preventing diseases and have led to the eradication or significant reduction of many serious illnesses.";
    source = "WHO, CDC, and medical research";
  } else if (text.includes("climate change is real")) {
    explanation = "Scientific evidence strongly supports the reality of climate change, with multiple independent lines of evidence showing rising global temperatures.";
    source = "IPCC, NASA, NOAA";
  } else if (text.includes("smoking causes cancer")) {
    explanation = "There is overwhelming evidence that smoking tobacco causes cancer, particularly lung cancer, as well as other serious health problems.";
    source = "CDC, WHO, American Cancer Society";
  } else if (text.includes("exercise is beneficial")) {
    explanation = "Regular physical activity has been consistently shown to improve health outcomes including cardiovascular health, mental health, and longevity.";
    source = "American Heart Association, WHO";
  }
  
  return {
    claimId,
    verdict: 'true' as const,
    source,
    explanation
  };
};
