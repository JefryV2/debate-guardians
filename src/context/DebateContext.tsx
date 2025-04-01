
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/lib/toast";

export interface Claim {
  id: string;
  text: string;
  timestamp: string;
  speakerId: string;
}

export interface FactCheck {
  id: string;
  claimId: string;
  verdict: 'true' | 'false' | 'unverified';
  source: string;
  explanation: string;
}

export interface Speaker {
  id: string;
  name: string;
  avatar: string;
  color: string;
  accuracyScore: number;
  totalClaims: number;
  verifiedClaims: number;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  speakerId: string;
  timestamp: Date;
  isClaim: boolean;
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

export const DebateProvider: React.FC<DebateProviderProps> = ({ children }) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      id: '1',
      name: 'Speaker 1',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=John',
      color: 'debate-blue',
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0
    },
    {
      id: '2',
      name: 'Speaker 2',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Jane',
      color: 'debate-red',
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0
    }
  ]);
  
  const [activeListener, setActiveListener] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string>('1');
  const [debugMode, setDebugMode] = useState<boolean>(false);

  const addTranscriptEntry = (entry: Omit<TranscriptEntry, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newEntry = { ...entry, id };
    setTranscript(prev => [...prev, newEntry]);

    if (entry.isClaim) {
      const newClaim = {
        id: id,
        text: entry.text,
        timestamp: entry.timestamp.toISOString(),
        speakerId: entry.speakerId
      };
      setClaims(prev => [...prev, newClaim]);
      
      if (debugMode) {
        toast.info(`Claim detected: ${entry.text.substring(0, 50)}...`, {
          description: `From Speaker ${entry.speakerId}`,
          duration: 3000,
        });
      }
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
    setClaims([]);
    setFactChecks([]);
    
    // Reset speaker scores
    setSpeakers(prev => prev.map(speaker => ({
      ...speaker,
      accuracyScore: 100,
      totalClaims: 0,
      verifiedClaims: 0
    })));
    
    toast.info("Debate transcript cleared");
  };

  const addFactCheck = (factCheck: Omit<FactCheck, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newFactCheck = { ...factCheck, id };
    setFactChecks(prev => [...prev, newFactCheck]);

    // Update speaker accuracy score
    const claim = claims.find(c => c.id === factCheck.claimId);
    if (claim) {
      setSpeakers(prev => prev.map(speaker => {
        if (speaker.id === claim.speakerId) {
          const totalClaims = speaker.totalClaims + 1;
          const verifiedClaims = speaker.verifiedClaims + (factCheck.verdict === 'true' ? 1 : 0);
          const accuracyScore = Math.round((verifiedClaims / totalClaims) * 100);
          return {
            ...speaker,
            totalClaims,
            verifiedClaims,
            accuracyScore
          };
        }
        return speaker;
      }));

      // Display toast for false claims
      if (factCheck.verdict === 'false') {
        const speaker = speakers.find(s => s.id === claim.speakerId);
        toast.error(`False Claim Detected!`, {
          description: `${speaker?.name || 'Speaker'}: "${claim.text.substring(0, 50)}..." - ${factCheck.explanation}`,
          duration: 5000,
        });
        
        // Play beep sound and interrupt with correction
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
        setDebugMode
      }}
    >
      {children}
    </DebateContext.Provider>
  );
};
