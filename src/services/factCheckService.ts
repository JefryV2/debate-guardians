import { Claim } from "@/context/DebateContext";
import { commonMyths } from "@/data/commonMyths";

// Function to check facts using AI (Gemini API integration)
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
        explanation: myth.explanation
      };
    }
  }
  
  return null;
};

// Gemini AI-powered fact checking function
const geminiFactCheck = async (claim: Claim) => {
  const claimText = claim.text;
  
  try {
    console.log("Gemini AI analyzing claim:", claimText);
    
    // Store API key in localStorage (in production, this should be handled server-side)
    const apiKey = localStorage.getItem("gemini-api-key");
    
    if (!apiKey) {
      console.warn("No Gemini API key found. Using fallback fact checking.");
      return fallbackFactCheck(claim);
    }
    
    // Prepare the prompt for Gemini
    const prompt = `
      Act as a professional fact-checker. Analyze this claim:
      
      "${claimText}"
      
      Is this claim true, false, or cannot be verified with certainty?
      
      For your response, provide:
      1. A verdict: ONLY "true", "false", or "unverified"
      2. Explanation: Brief factual explanation supporting your verdict (2-3 sentences)
      3. Source: Relevant source or reference for the information
      
      Format your response as JSON:
      {
        "verdict": "true/false/unverified",
        "explanation": "Your explanation here",
        "source": "Your source here"
      }
      
      Focus on factual accuracy and reliability.
    `;
    
    // Make request to Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
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
    let parsedResponse: { verdict: string; explanation: string; source: string };
    
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
    
    return {
      claimId: claim.id,
      verdict: normalizedVerdict,
      source: parsedResponse.source || "Google Gemini AI",
      explanation: parsedResponse.explanation || "This claim has been analyzed by AI."
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
      explanation: "This claim contradicts scientific consensus. (AI service unavailable, using fallback)"
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
      explanation: "This claim is supported by scientific consensus. (AI service unavailable, using fallback)"
    };
  }
  
  return {
    claimId: claim.id,
    verdict: 'unverified' as const,
    source: "Fallback fact checker",
    explanation: "Unable to verify this claim. (AI service unavailable, using fallback)"
  };
};
