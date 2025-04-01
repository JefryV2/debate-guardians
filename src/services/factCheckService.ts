
import { commonMyths } from "@/data/commonMyths";
import { Claim } from "@/context/DebateContext";

export const checkFactAgainstDatabase = (claim: Claim) => {
  // In a real app, this would do string matching, embedding similarity, or other NLP techniques
  // For our MVP, we'll do simple substring matching
  
  const claimText = claim.text.toLowerCase();
  
  for (const myth of commonMyths) {
    // If the claim contains the myth text, or vice versa
    if (claimText.includes(myth.claim.toLowerCase()) || 
        myth.claim.toLowerCase().includes(claimText)) {
      // Return the fact check result
      return {
        claimId: claim.id,
        verdict: myth.verdict as 'true' | 'false' | 'unverified',
        source: myth.source,
        explanation: myth.explanation
      };
    }
  }
  
  // If no match found, return unverified
  return {
    claimId: claim.id,
    verdict: 'unverified' as const,
    source: "No matching fact check found",
    explanation: "This claim requires further verification."
  };
};
