import { useDebate, TranscriptEntry } from "@/context/DebateContext";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Flag, CheckCircle, AlertCircle, Volume2, Mic } from "lucide-react";
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
}: { 
  entry: TranscriptEntry; 
  speakerColor: string; 
  speakerName: string;
  onMarkAsClaim: () => void;
}) => {
  const { text, isClaim, emotion, speakingRate, timestamp } = entry;
  
  const getColorClasses = () => {
    const colorMap: Record<string, string> = {
      'debate-blue': 'bg-blue-600',
      'debate-red': 'bg-red-600',
      'debate-green': 'bg-green-600',
      'debate-orange': 'bg-orange-600',
      'debate-purple': 'bg-purple-600',
      'debate-yellow': 'bg-yellow-600',
      'debate-cyan': 'bg-cyan-600',
      'debate-pink': 'bg-pink-600'
    };
    return colorMap[speakerColor] || 'bg-gray-600';
  };
  
  return (
    <div className="relative group py-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors duration-200 rounded-lg px-2 -mx-2">
      <div className="flex items-start gap-3">
        <div 
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mt-0.5 shadow-sm",
            getColorClasses()
          )}
        >
          {speakerName.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-primary" />
              {speakerName}
            </span>
            {emotion && (
              <span className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-medium border border-purple-500/30">
                {emotion}
              </span>
            )}
            {speakingRate && (
              <span className="text-xs bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 px-2.5 py-0.5 rounded-full font-medium border border-blue-500/30">
                {Math.round(speakingRate)} WPM
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className="text-foreground/90 leading-relaxed">
            {isClaim ? (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border-l-4 border-green-500 shadow-sm my-1">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{text}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm pl-1 pr-8">{text}</div>
            )}
          </div>
        </div>
        
        {!isClaim && (
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-xs text-xs h-7 px-2.5 border-border hover:bg-muted rounded-md"
            onClick={() => {
              onMarkAsClaim();
              toast.success("Entry marked as claim", {
                description: "This statement will now be fact-checked"
              });
            }}
          >
            <Flag className="h-3 w-3 mr-1" />
            Mark
          </Button>
        )}
      </div>
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
      color: speaker?.color || "debate-blue",
      name: speaker?.name || "Unknown Speaker"
    };
  };

  const handleMarkAsClaim = (entryId: string) => {
    markEntryAsClaim(entryId);
  };
  
  return (
    <div className="bg-card rounded-xl h-full flex flex-col border border-border shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-muted/50 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Live Transcript
        </h2>
        <div className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-medium rounded-full flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Live
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 custom-scrollbar" ref={scrollRef}>
        <div className="space-y-4">
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                <Mic className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No transcript yet</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">Click "Start Listening" to begin capturing audio</p>
              <div className="flex items-center gap-2 text-sm bg-primary/20 text-primary px-4 py-2 rounded-full">
                <Mic className="h-4 w-4" />
                <span>Ready to capture speech</span>
              </div>
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
      <div className="px-4 py-3 bg-muted/50 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
        <span>{transcript.length} entries</span>
        <span>Real-time transcription</span>
      </div>
    </div>
  );
};

export default TranscriptDisplay;