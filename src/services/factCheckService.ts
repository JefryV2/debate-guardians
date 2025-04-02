
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
        explanation: myth.explanation,
        confidenceScore: myth.verdict === 'unverified' ? 50 : 90 // High confidence for database entries
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
    
    // Prepare the prompt for Gemini - enhanced with more details
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
      
      Format your response as JSON:
      {
        "verdict": "true/false/unverified",
        "explanation": "Your explanation here",
        "source": "Your source here",
        "confidence": number,
        "knowledgeGaps": "Areas of limited consensus or knowledge here",
        "alternativePerspective": "Alternative perspective here"
      }
      
      Focus on factual accuracy and reliability.
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
    
    return {
      claimId: claim.id,
      verdict: normalizedVerdict,
      source: parsedResponse.source || "Google Gemini 2.0 Flash",
      explanation: parsedResponse.explanation || "This claim has been analyzed by AI.",
      confidenceScore: parsedResponse.confidence || generateConfidenceScore(normalizedVerdict),
      alternativePerspectives
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
      confidenceScore: 85
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
      confidenceScore: 90
    };
  }
  
  return {
    claimId: claim.id,
    verdict: 'unverified' as const,
    source: "Fallback fact checker",
    explanation: "Unable to verify this claim. (AI service unavailable, using fallback)",
    confidenceScore: 40
  };
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
