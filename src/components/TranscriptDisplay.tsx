
import { useDebate, TranscriptEntry } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface TranscriptEntryProps {
  entry: TranscriptEntry;
  speakerColor: string;
  speakerName: string;
}

const TranscriptEntryComponent = ({ entry, speakerColor, speakerName }: TranscriptEntryProps) => {
  const { text, isClaim } = entry;
  
  return (
    <div className={cn(
      "mb-2 p-2 rounded-md",
      isClaim ? "border border-yellow-300 bg-yellow-50" : "bg-gray-50"
    )}>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span className="font-medium">{speakerName}</span>
        <div className="flex items-center">
          <span>{entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isClaim && (
            <span className="ml-2 text-yellow-600 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Claim
            </span>
          )}
        </div>
      </div>
      <div className={cn(
        "text-gray-800", 
        `border-l-4 border-${speakerColor} pl-2 rounded-l`
      )}>
        {text}
      </div>
    </div>
  );
};

const TranscriptDisplay = () => {
  const { transcript, speakers } = useDebate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);
  
  // Get speaker info
  const getSpeakerInfo = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    return {
      color: speaker?.color || "gray",
      name: speaker?.name || "Unknown Speaker"
    };
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Live Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mb-3 text-gray-400"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
              <p className="text-base">No transcript yet</p>
              <p className="text-xs">Click "Start Listening" and begin speaking</p>
            </div>
          ) : (
            transcript.map(entry => {
              const { color, name } = getSpeakerInfo(entry.speakerId);
              return (
                <TranscriptEntryComponent 
                  key={entry.id} 
                  entry={entry} 
                  speakerColor={color}
                  speakerName={name}
                />
              );
            })
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptDisplay;
