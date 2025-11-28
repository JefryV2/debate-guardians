import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/lib/toast";
import { EmotionType } from "@/services/speechService";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface Claim {
  id: string;
  text: string;
  timestamp: string;
  speakerId: string;
  topic?: string;
  fallacies?: string[];
  knowledgeGapIdentified?: boolean;
  speakingRate?: number; // Words per minute
  isManuallyHighlighted?: boolean; // Added for manual highlighting
}

export interface FactCheck {
  id: string;
  claimId: string;
  verdict: 'true' | 'false' | 'unverified';
  source: string;
  explanation: string;
  confidenceScore?: number; // 0-100
  alternativePerspectives?: string[];
  logicalFallacies?: string[]; // Added for advanced fallacy detection
  debunkedStudies?: string; // Added for study validity assessment
  counterArgument?: string; // Added for counter argument suggestions
}

export interface ArgumentPatterns {
  citesStudies: number; // Frequency of citing studies/research
  usesDebunkedSources: number; // Frequency of using debunked sources
  fallacyFrequency: Record<string, number>; // Frequency of each fallacy type
  factAccuracyByTopic: Record<string, number>; // Accuracy rate by topic
  emotionalAppealFrequency: number; // How often they appeal to emotion
  overallBias?: 'factual' | 'political' | 'emotional' | 'scientific' | 'sensationalist' | 'neutral'; // Detected bias in argumentation
  preferredTopics: string[]; // Topics they speak most about
  commonSources?: string[]; // Sources they frequently cite
  improvementTrend?: boolean; // Whether accuracy is improving over time
}

export interface Speaker {
  id: string;
  name: string;
  avatar: string;
  color: string;
  accuracyScore: number;
  totalClaims: number;
  verifiedClaims: number;
  claimHistory?: {
    date: string;
    totalClaims: number;
    trueClaims: number;
    accuracyScore: number;
  }[];
  topicExpertise?: Record<string, number>; // Topic name to accuracy score
  argumentPatterns?: ArgumentPatterns; // New field for argument patterns
}

export interface TranscriptEntry {
  id: string;
  text: string;
  speakerId: string;
  timestamp: Date;
  isClaim: boolean;
  emotion?: EmotionType;
  speakingRate?: number; // Words per minute
  fallacies?: string[];
}

interface DebateContextType {
  speakers: Speaker[];
  setSpeakers: (speakers: Speaker[]) => void;
  activeListener: boolean;
  setActiveListener: (active: boolean) => void;
  transcript: TranscriptEntry[];
  addTranscriptEntry: (entry: Omit<TranscriptEntry, 'id'>) => void;
  clearTranscript: () => void;
  claims: Claim[];
  factChecks: FactCheck[];
  addFactCheck: (factCheck: Omit<FactCheck, 'id'>) => void;
  currentSpeakerId: string;
  setCurrentSpeakerId: (id: string) => void;
  debugMode: boolean;
  setDebugMode: (mode: boolean) => void;
  addSpeaker: () => void;
  removeSpeaker: (id: string) => void;
  updateSpeakerName: (id: string, name: string) => void;
  markEntryAsClaim: (entryId: string) => void;
  continuousAnalysisMode: boolean;
  setContinuousAnalysisMode: (mode: boolean) => void;
  toleranceLevel: number;
  setToleranceLevel: (level: number) => void;
}

const DebateContext = createContext<DebateContextType | undefined>(undefined);

export const useDebate = () => {
  const context = useContext(DebateContext);
  if (!context) {
    throw new Error("useDebate must be used within a DebateProvider");
  }
  return context;
};

interface DebateProviderProps {
  children: ReactNode;
}

const speakerColors = [
  'debate-blue', 'debate-red', 'debate-green', 'debate-orange', 
  'debate-purple', 'debate-yellow', 'debate-cyan', 'debate-pink'
];

export const DebateProvider: React.FC<DebateProviderProps> = ({ children }) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      id: '1',
      name: 'Speaker 1',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=John',
      color: 'debate-blue',
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0,
      claimHistory: [],
      topicExpertise: {},
      argumentPatterns: {
        citesStudies: 0,
        usesDebunkedSources: 0,
        fallacyFrequency: {},
        factAccuracyByTopic: {},
        emotionalAppealFrequency: 0,
        preferredTopics: []
      }
    },
    {
      id: '2',
      name: 'Speaker 2',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Jane',
      color: 'debate-red',
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0,
      claimHistory: [],
      topicExpertise: {},
      argumentPatterns: {
        citesStudies: 0,
        usesDebunkedSources: 0,
        fallacyFrequency: {},
        factAccuracyByTopic: {},
        emotionalAppealFrequency: 0,
        preferredTopics: []
      }
    }
  ]);
  
  const [activeListener, setActiveListener] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string>('1');
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [continuousAnalysisMode, setContinuousAnalysisMode] = useState<boolean>(true);
  const [toleranceLevel, setToleranceLevel] = useLocalStorage<number>("debate-tolerance-level", 15);

  useEffect(() => {
    localStorage.setItem("debate-tolerance-level", toleranceLevel.toString());
  }, [toleranceLevel]);

  const addSpeaker = () => {
    if (speakers.length >= 8) {
      toast.error("Maximum number of speakers reached", {
        description: "You cannot add more than 8 speakers."
      });
      return;
    }
    
    const newId = String(speakers.length + 1);
    const colorIndex = speakers.length % speakerColors.length;
    
    const newSpeaker: Speaker = {
      id: newId,
      name: `Speaker ${newId}`,
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=Speaker${newId}`,
      color: speakerColors[colorIndex],
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0,
      claimHistory: [],
      topicExpertise: {},
      argumentPatterns: {
        citesStudies: 0,
        usesDebunkedSources: 0,
        fallacyFrequency: {},
        factAccuracyByTopic: {},
        emotionalAppealFrequency: 0,
        preferredTopics: []
      }
    };
    
    setSpeakers([...speakers, newSpeaker]);
    toast.success(`Added ${newSpeaker.name}`, {
      description: "New speaker has been added to the debate."
    });
  };

  const removeSpeaker = (id: string) => {
    if (speakers.length <= 2) {
      toast.error("Cannot remove speaker", {
        description: "A debate requires at least 2 speakers."
      });
      return;
    }
    
    if (id === currentSpeakerId) {
      const remainingSpeakers = speakers.filter(s => s.id !== id);
      setCurrentSpeakerId(remainingSpeakers[0].id);
    }
    
    setSpeakers(speakers.filter(speaker => speaker.id !== id));
    toast.success("Speaker removed", {
      description: "Speaker has been removed from the debate."
    });
  };

  const updateSpeakerName = (id: string, name: string) => {
    setSpeakers(prev => prev.map(speaker => 
      speaker.id === id ? { ...speaker, name } : speaker
    ));
  };

  const addTranscriptEntry = (entry: Omit<TranscriptEntry, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const words = entry.text.trim().split(/\s+/).length;
    const speakingRate = words * (60 / 5);
    
    const fallacies = detectLogicalFallacies(entry.text);
    
    const newEntry = { 
      ...entry, 
      id,
      speakingRate,
      fallacies: fallacies.length > 0 ? fallacies : undefined
    };
    
    setTranscript(prev => [...prev, newEntry]);

    if (continuousAnalysisMode && !entry.isClaim) {
      const recentEntries = getRecentEntries(entry.speakerId);
      
      const combinedText = recentEntries.map(e => e.text).join(' ') + ' ' + entry.text;
      
      const isCombinedClaim = classifyTopic(combinedText) !== undefined || 
                               detectLogicalFallacies(combinedText).length > 0 ||
                               identifyKnowledgeGaps(combinedText);
      
      if (isCombinedClaim) {
        createClaimFromEntry({
          ...newEntry,
          text: combinedText,
          isClaim: true
        });
        
        if (debugMode) {
          toast.info(`Combined claim detected from recent entries`, {
            description: `Analyzed ${recentEntries.length + 1} entries together`,
            duration: 3000,
          });
        }
      }
    }

    if (entry.isClaim) {
      createClaimFromEntry(newEntry);
    }
  };

  const createClaimFromEntry = (entry: TranscriptEntry) => {
    const topic = classifyTopic(entry.text);
    const knowledgeGapIdentified = identifyKnowledgeGaps(entry.text);
    
    const newClaim = {
      id: entry.id,
      text: entry.text,
      timestamp: entry.timestamp.toISOString(),
      speakerId: entry.speakerId,
      topic,
      fallacies: entry.fallacies,
      knowledgeGapIdentified,
      speakingRate: entry.speakingRate
    };
    
    setClaims(prev => [...prev, newClaim]);
    
    if (entry.fallacies && entry.fallacies.length > 0) {
      const speaker = speakers.find(s => s.id === entry.speakerId);
      toast.warning(`Fallacy detected: ${entry.fallacies[0]}`, {
        description: `From ${speaker?.name || 'Speaker'}: "${entry.text.substring(0, 50)}..."`,
        duration: 4000,
      });
    }
    
    if (entry.speakingRate && entry.speakingRate > 180) {
      const speaker = speakers.find(s => s.id === entry.speakerId);
      toast.info(`Fast speech detected`, {
        description: `${speaker?.name || 'Speaker'} is speaking rapidly at ${Math.round(entry.speakingRate)} words per minute`,
        duration: 3000,
      });
    }
    
    if (knowledgeGapIdentified) {
      toast.info(`Knowledge Gap Identified`, {
        description: `This claim touches on an area with limited scientific consensus`,
        duration: 4000,
      });
    }
    
    if (debugMode) {
      toast.info(`Claim detected: ${entry.text.substring(0, 50)}...`, {
        description: `From Speaker ${entry.speakerId}${topic ? ` | Topic: ${topic}` : ''}`,
        duration: 3000,
      });
    }
  };

  const getRecentEntries = (speakerId: string, maxEntries: number = 3) => {
    return transcript
      .filter(entry => entry.speakerId === speakerId && !entry.isClaim)
      .slice(-maxEntries);
  };

  const markEntryAsClaim = (entryId: string) => {
    const entry = transcript.find(entry => entry.id === entryId);
    
    if (!entry) {
      toast.error("Entry not found", {
        description: "The selected entry could not be found in the transcript."
      });
      return;
    }
    
    if (entry.isClaim) {
      toast.info("Already marked as claim", {
        description: "This entry is already marked as a claim."
      });
      return;
    }
    
    setTranscript(prev => 
      prev.map(item => 
        item.id === entryId ? { ...item, isClaim: true } : item
      )
    );
    
    createClaimFromEntry({
      ...entry,
      isClaim: true
    });
    
    toast.success("Entry marked as claim", {
      description: "The selected entry has been marked as a claim and will be fact-checked."
    });
  };

  const clearTranscript = () => {
    setTranscript([]);
    setClaims([]);
    setFactChecks([]);
    
    setSpeakers(prev => prev.map(speaker => ({
      ...speaker,
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0,
      claimHistory: [],
      topicExpertise: {},
      argumentPatterns: {
        citesStudies: 0,
        usesDebunkedSources: 0,
        fallacyFrequency: {},
        factAccuracyByTopic: {},
        emotionalAppealFrequency: 0,
        preferredTopics: []
      }
    })));
    
    toast.info("Debate transcript cleared");
  };

  const addFactCheck = (factCheck: Omit<FactCheck, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const confidenceScore = generateConfidenceScore(factCheck.verdict);
    
    const newFactCheck = { ...factCheck, id, confidenceScore };
    setFactChecks(prev => [...prev, newFactCheck]);

    const claim = claims.find(c => c.id === factCheck.claimId);
    if (claim) {
      setSpeakers(prev => prev.map(speaker => {
        if (speaker.id === claim.speakerId) {
          const totalClaims = speaker.totalClaims + 1;
          const verifiedClaims = speaker.verifiedClaims + (factCheck.verdict === 'true' ? 1 : 0);
          const accuracyScore = Math.round((verifiedClaims / totalClaims) * 100);
          
          const today = new Date().toISOString().split('T')[0];
          const claimHistory = [...(speaker.claimHistory || [])];
          const existingEntry = claimHistory.find(entry => entry.date === today);
          
          if (existingEntry) {
            existingEntry.totalClaims += 1;
            existingEntry.trueClaims += factCheck.verdict === 'true' ? 1 : 0;
            existingEntry.accuracyScore = Math.round((existingEntry.trueClaims / existingEntry.totalClaims) * 100);
          } else {
            claimHistory.push({
              date: today,
              totalClaims: 1,
              trueClaims: factCheck.verdict === 'true' ? 1 : 0,
              accuracyScore: factCheck.verdict === 'true' ? 100 : 0
            });
          }
          
          const topicExpertise = { ...(speaker.topicExpertise || {}) };
          if (claim.topic) {
            const currentExpertise = topicExpertise[claim.topic] || 0;
            const totalTopicClaims = (topicExpertise[`${claim.topic}_total`] || 0) + 1;
            const verifiedTopicClaims = (topicExpertise[`${claim.topic}_verified`] || 0) + 
                                       (factCheck.verdict === 'true' ? 1 : 0);
            
            topicExpertise[claim.topic] = Math.round((verifiedTopicClaims / totalTopicClaims) * 100);
            topicExpertise[`${claim.topic}_total`] = totalTopicClaims;
            topicExpertise[`${claim.topic}_verified`] = verifiedTopicClaims;
          }
          
          const argumentPatterns = { ...(speaker.argumentPatterns || {
            citesStudies: 0,
            usesDebunkedSources: 0,
            fallacyFrequency: {},
            factAccuracyByTopic: {},
            emotionalAppealFrequency: 0,
            preferredTopics: []
          })};
          
          if (claim.text.toLowerCase().includes('study') || 
              claim.text.toLowerCase().includes('research') || 
              claim.text.toLowerCase().includes('scientist') ||
              claim.text.toLowerCase().includes('paper')) {
            argumentPatterns.citesStudies += 1;
          }
          
          if (factCheck.debunkedStudies) {
            argumentPatterns.usesDebunkedSources += 1;
          }
          
          if (claim.fallacies) {
            claim.fallacies.forEach(fallacy => {
              argumentPatterns.fallacyFrequency[fallacy] = (argumentPatterns.fallacyFrequency[fallacy] || 0) + 1;
            });
          }
          
          if (claim.topic) {
            const isTrue = factCheck.verdict === 'true';
            const topicClaims = argumentPatterns.factAccuracyByTopic[`${claim.topic}_total`] || 0;
            const topicTrueClaims = argumentPatterns.factAccuracyByTopic[`${claim.topic}_true`] || 0;
            
            argumentPatterns.factAccuracyByTopic[`${claim.topic}_total`] = topicClaims + 1;
            argumentPatterns.factAccuracyByTopic[`${claim.topic}_true`] = topicTrueClaims + (isTrue ? 1 : 0);
            argumentPatterns.factAccuracyByTopic[claim.topic] = Math.round(((topicTrueClaims + (isTrue ? 1 : 0)) / (topicClaims + 1)) * 100);
          }
          
          if (claim.text.toLowerCase().includes('feel') ||
              claim.text.toLowerCase().includes('emotion') ||
              claim.text.toLowerCase().includes('believe') ||
              claim.text.toLowerCase().includes('think of the') ||
              claim.text.toLowerCase().includes('imagine if')) {
            argumentPatterns.emotionalAppealFrequency += 1;
          }
          
          if (claim.topic && !argumentPatterns.preferredTopics.includes(claim.topic)) {
            argumentPatterns.preferredTopics = 
              [...argumentPatterns.preferredTopics, claim.topic]
                .sort((a, b) => {
                  const aCount = topicExpertise[`${a}_total`] || 0;
                  const bCount = topicExpertise[`${b}_total`] || 0;
                  return bCount - aCount;
                })
                .slice(0, 5);
          }
          
          const determineBias = () => {
            const totalClaimsAnalyzed = totalClaims >= 5 ? totalClaims : 0;
            if (totalClaimsAnalyzed === 0) return undefined;
            
            const studyRatio = argumentPatterns.citesStudies / totalClaimsAnalyzed;
            const emotionalRatio = argumentPatterns.emotionalAppealFrequency / totalClaimsAnalyzed;
            const fallacyRatio = Object.values(argumentPatterns.fallacyFrequency)
              .reduce((sum, count) => sum + count, 0) / totalClaimsAnalyzed;
            const debunkedRatio = argumentPatterns.usesDebunkedSources / totalClaimsAnalyzed;
            
            if (studyRatio > 0.6 && accuracyScore > 70) return 'scientific';
            if (emotionalRatio > 0.5) return 'emotional';
            if (fallacyRatio > 0.4) return 'sensationalist';
            if (debunkedRatio > 0.3) return 'political';
            if (accuracyScore > 80) return 'factual';
            return 'neutral';
          };
          
          argumentPatterns.overallBias = determineBias();
          
          if (claimHistory.length >= 3) {
            const recent = claimHistory.slice(-3);
            argumentPatterns.improvementTrend = 
              recent[2].accuracyScore > recent[0].accuracyScore;
          }
          
          return {
            ...speaker,
            totalClaims,
            verifiedClaims,
            accuracyScore,
            claimHistory,
            topicExpertise,
            argumentPatterns
          };
        }
        return speaker;
      }));

      if (factCheck.verdict === 'false') {
        const speaker = speakers.find(s => s.id === claim.speakerId);
        toast.error(`False Claim Detected!`, {
          description: `${speaker?.name || 'Speaker'}: "${claim.text.substring(0, 50)}..." - ${factCheck.explanation}`,
          duration: 5000,
        });
        
        try {
          const beep = new Audio('/beep.mp3');
          beep.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
          console.log('Error playing beep sound:', e);
        }
      }
    }
  };

  return (
    <DebateContext.Provider
      value={{
        speakers,
        setSpeakers,
        activeListener,
        setActiveListener,
        transcript,
        addTranscriptEntry,
        clearTranscript,
        claims,
        factChecks,
        addFactCheck,
        currentSpeakerId,
        setCurrentSpeakerId,
        debugMode,
        setDebugMode,
        addSpeaker,
        removeSpeaker,
        updateSpeakerName,
        markEntryAsClaim,
        continuousAnalysisMode,
        setContinuousAnalysisMode,
        toleranceLevel,
        setToleranceLevel
      }}
    >
      {children}
    </DebateContext.Provider>
  );
};

const classifyTopic = (text: string): string | undefined => {
  const lowerText = text.toLowerCase();
  
  const topicKeywords: Record<string, string[]> = {
    'Politics': ['government', 'election', 'democrat', 'republican', 'congress', 'senate', 'policy', 'president', 'political', 'legislation', 'vote'],
    'Health': ['vaccine', 'medicine', 'doctor', 'hospital', 'healthcare', 'treatment', 'disease', 'cure', 'medical', 'pandemic', 'covid'],
    'Science': ['research', 'scientist', 'study', 'evidence', 'experiment', 'laboratory', 'discovery', 'innovation', 'data', 'theory'],
    'Climate': ['global warming', 'climate change', 'environment', 'carbon', 'emissions', 'temperature', 'pollution', 'renewable', 'sustainable'],
    'Economics': ['economy', 'inflation', 'market', 'financial', 'budget', 'tax', 'spending', 'economic', 'recession', 'income', 'investment'],
    'Education': ['school', 'university', 'college', 'student', 'teacher', 'education', 'learn', 'classroom', 'academic', 'degree', 'curriculum'],
    'Technology': ['computer', 'digital', 'internet', 'software', 'hardware', 'social media', 'artificial intelligence', 'tech', 'innovation', 'algorithm'],
    'Social Issues': ['equality', 'rights', 'justice', 'discrimination', 'diversity', 'inclusion', 'gender', 'race', 'community', 'society'],
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return topic;
    }
  }
  
  return undefined;
};

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
    ]
  };
  
  for (const [fallacy, patterns] of Object.entries(fallacyPatterns)) {
    if (patterns.some(pattern => pattern.test(lowerText))) {
      detectedFallacies.push(fallacy);
    }
  }
  
  return detectedFallacies;
};

const identifyKnowledgeGaps = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  
  const knowledgeGapKeywords = [
    'cure for cancer', 
    'consciousness',
    'dark matter',
    'quantum gravity',
    'brain',
    'next pandemic',
    'predict stock market',
    'artificial general intelligence',
    'origin of life',
    'alien life',
    'cause of autism',
    'long covid',
    'nutrition',
    'black holes'
  ];
  
  const uncertaintyPhrases = [
    'not fully understood',
    'still researching',
    'no scientific consensus',
    'scientists disagree',
    'emerging research',
    'preliminary findings',
    'ongoing debate',
    'limited evidence',
    'inconclusive'
  ];
  
  const hasGapTopic = knowledgeGapKeywords.some(keyword => lowerText.includes(keyword));
  
  const hasUncertaintyPhrase = uncertaintyPhrases.some(phrase => lowerText.includes(phrase));
  
  const absoluteClaimAboutUncertain = knowledgeGapKeywords.some(keyword => lowerText.includes(keyword)) && 
    (lowerText.includes('definitely') || 
     lowerText.includes('absolutely') || 
     lowerText.includes('without doubt') || 
     lowerText.includes('proven fact'));
  
  return hasGapTopic || hasUncertaintyPhrase || absoluteClaimAboutUncertain;
};

const generateConfidenceScore = (verdict: 'true' | 'false' | 'unverified'): number => {
  if (verdict === 'unverified') {
    return Math.floor(Math.random() * 30) + 20;
  } else if (verdict === 'true') {
    return Math.floor(Math.random() * 20) + 75;
  } else {
    return Math.floor(Math.random() * 25) + 70;
  }
};
