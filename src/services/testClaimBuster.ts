// Simple test script to verify ClaimBuster integration
import { hybridFactCheck } from './hybridFactCheckService';
import { Claim } from '@/context/DebateContext';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    }
  };
})();

// Only set up mock if not in browser environment
if (typeof window === 'undefined') {
  (global as any).localStorage = localStorageMock;
}

// Test function
async function testClaimBuster() {
  console.log('Testing ClaimBuster integration...');
  
  // Test claim
  const testClaim: Claim = {
    id: 'test-claim-1',
    text: 'The Earth is round according to scientific studies.',
    timestamp: new Date().toISOString(),
    speakerId: 'speaker-1'
  };
  
  // Test 1: Without API key (should use simulation)
  console.log('\n--- Test 1: Without API key ---');
  try {
    const result1 = await hybridFactCheck(testClaim, 'claimbuster');
    console.log('Result:', result1);
    console.log('Source:', result1.source);
    console.log('Verdict:', result1.verdict);
  } catch (error) {
    console.error('Error in Test 1:', error);
  }
  
  // Test 2: With API key (would call real API if key was valid)
  console.log('\n--- Test 2: With API key ---');
  try {
    // Set a fake API key for testing
    localStorage.setItem('claimbuster-api-key', 'test-api-key');
    
    const result2 = await hybridFactCheck(testClaim, 'claimbuster');
    console.log('Result:', result2);
    console.log('Source:', result2.source);
    console.log('Verdict:', result2.verdict);
    
    // Clean up
    localStorage.removeItem('claimbuster-api-key');
  } catch (error) {
    console.error('Error in Test 2:', error);
  }
  
  console.log('\nTest completed.');
}

// Run the test if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testClaimBuster();
}

export default testClaimBuster;