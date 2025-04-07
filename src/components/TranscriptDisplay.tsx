
import { useDebate, TranscriptEntry } from "@/context/DebateContext";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Flag, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptEntryProps {
  entry: TranscriptEntry;
  speakerColor: string;
  speakerName: string;
  onMarkAsClaim: () => void;
}

const TranscriptEntryComponent = ({ 
  entry, 
  speakerColor, 
  speakerName, 
  onMarkAsClaim 
}: TranscriptEntryProps) => {
  const { text, isClaim, timestamp, emotion } = entry;
  
  return (
    <div className="mb-4 relative group p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white" 
          style={{ backgroundColor: speakerColor || '#9333ea' }}
        >
          {speakerName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{speakerName}</span>
            {emotion && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">{emotion}</span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {isClaim && (
          <div className="ml-auto flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-700">Fact-checked</span>
          </div>
        )}
      </div>
      
      <div className="pl-10 text-gray-800">
        {isClaim ? (
          <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
            {text}
          </div>
        ) : text}
      </div>
      
      {!isClaim && (
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            onMarkAsClaim();
            toast.success("Entry marked as claim", {
              description: "This statement will now be fact-checked"
            });
          }}
        >
          <Flag className="h-3 w-3 mr-1" />
          Mark as Claim
        </Button>
      )}
    </div>
  );
};

const TranscriptDisplay = () => {
  const { transcript, speakers, markEntryAsClaim } = useDebate();
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
      color: speaker?.color || "#9333ea",
      name: speaker?.name || "Unknown Speaker"
    };
  };

  const handleMarkAsClaim = (entryId: string) => {
    markEntryAsClaim(entryId);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm h-full">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-medium">Live Transcript</h2>
        <div className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Listening
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-250px)] pr-2 custom-scrollbar">
        <div className="pr-4">
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 p-6">
              <p className="mb-2">No transcript yet</p>
              <p className="text-xs">Click "Start Listening" to begin capturing audio</p>
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
                  onMarkAsClaim={() => handleMarkAsClaim(entry.id)}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptDisplay;
