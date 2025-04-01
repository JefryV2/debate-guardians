
import { useDebate, TranscriptEntry } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TranscriptEntryProps {
  entry: TranscriptEntry;
  speakerColor: string;
}

const TranscriptEntryComponent = ({ entry, speakerColor }: TranscriptEntryProps) => {
  const { text, isClaim } = entry;
  
  return (
    <div className={cn(
      "mb-2 p-2 rounded-md",
      isClaim ? "border border-yellow-300 bg-yellow-50" : "bg-gray-50"
    )}>
      <div className="text-sm text-gray-500 mb-1">
        {entry.timestamp.toLocaleTimeString()}
        {isClaim && <span className="ml-2 text-yellow-600 font-medium">Claim</span>}
      </div>
      <div className={cn("text-gray-800", `border-l-4 border-${speakerColor} pl-2`)}>
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
  
  // Get speaker colors
  const getSpeakerColor = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    return speaker?.color || "gray";
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Live Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {transcript.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No transcript yet. Start speaking!
            </div>
          ) : (
            transcript.map(entry => (
              <TranscriptEntryComponent 
                key={entry.id} 
                entry={entry} 
                speakerColor={getSpeakerColor(entry.speakerId)}
              />
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptDisplay;
