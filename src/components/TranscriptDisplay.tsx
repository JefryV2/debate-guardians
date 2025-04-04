
import { useDebate, TranscriptEntry } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Mic, Flag, Fingerprint, Clock } from "lucide-react";
import { EmotionType } from "@/services/speechService";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface TranscriptEntryProps {
  entry: TranscriptEntry;
  speakerColor: string;
  speakerName: string;
  onMarkAsClaim: () => void;
  argumentStyle?: string;
}

const TranscriptEntryComponent = ({ 
  entry, 
  speakerColor, 
  speakerName, 
  onMarkAsClaim,
  argumentStyle
}: TranscriptEntryProps) => {
  const { text, isClaim, timestamp, emotion } = entry;
  
  const getEmotionBadge = () => {
    if (!emotion) return null;
    
    const getEmotionColor = () => {
      switch(emotion) {
        case 'angry': return 'bg-red-100 text-red-800 border-red-200';
        case 'happy': return 'bg-green-100 text-green-800 border-green-200';
        case 'sad': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'excited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'frustrated': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'uncertain': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };
    
    return (
      <Badge variant="outline" className={`ml-2 ${getEmotionColor()} text-xs py-0 px-1.5`}>
        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
      </Badge>
    );
  };
  
  // Get bias color
  const getBiasColor = (bias?: string) => {
    switch(bias) {
      case 'factual': return 'text-emerald-600';
      case 'scientific': return 'text-blue-600';
      case 'emotional': return 'text-amber-600';
      case 'political': return 'text-purple-600';
      case 'sensationalist': return 'text-rose-600';
      default: return 'text-slate-600';
    }
  };
  
  return (
    <div className={cn(
      "mb-3 p-3 rounded-lg transition-all group relative",
      isClaim 
        ? "border-l-4 border-l-amber-400 border-t border-r border-b border-amber-200 bg-amber-50/70 shadow-sm" 
        : "bg-white border-l-4 border-l-transparent border border-gray-100 shadow-sm hover:border-gray-200"
    )}>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1.5">
        <span className="font-medium flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full bg-${speakerColor}`}></span>
          {speakerName}
          {getEmotionBadge()}
          
          {/* Show argument style if available */}
          {argumentStyle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "ml-1 cursor-help",
                    getBiasColor(argumentStyle)
                  )}>
                    <Fingerprint className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    {speakerName} tends to use a <span className="font-medium">{argumentStyle}</span> argumentation style
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
        <div className="flex items-center">
          <span className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isClaim && (
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1 px-1.5 py-0 text-xs">
              <AlertCircle className="h-3 w-3" />
              Claim
            </Badge>
          )}
        </div>
      </div>
      <div className={cn(
        "text-gray-800", 
        `border-l-2 border-${speakerColor} pl-3 py-1 rounded-l`
      )}>
        {text}
      </div>
      
      {/* Manual claim highlight button - make it more visible */}
      {!isClaim && (
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
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
      color: speaker?.color || "gray",
      name: speaker?.name || "Unknown Speaker",
      argumentStyle: speaker?.argumentPatterns?.overallBias
    };
  };

  const handleMarkAsClaim = (entryId: string) => {
    markEntryAsClaim(entryId);
  };
  
  return (
    <Card className="h-full border shadow-lg bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 border-b bg-white/80">
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-slate-100">
            <Mic className="h-5 w-5 text-slate-600" />
          </div>
          Live Transcript
          <div className="text-xs text-slate-500 font-normal ml-auto flex items-center">
            <Flag className="h-3 w-3 mr-1 text-amber-500" />
            Hover over entries to mark claims manually
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px] pr-4" ref={scrollRef}>
          <div className="p-4">
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-gray-400"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                    <line x1="12" x2="12" y1="19" y2="22"></line>
                  </svg>
                </div>
                <p className="text-lg font-medium">No transcript yet</p>
                <p className="text-sm mt-1">Click "Start Listening" and begin speaking</p>
                <div className="mt-4 text-xs flex flex-col items-center gap-2 p-3 border border-dashed border-amber-300 rounded-md bg-amber-50 max-w-xs">
                  <div className="flex items-center gap-1">
                    <Flag className="h-3 w-3 text-amber-500" /> 
                    <span className="font-medium">New Feature:</span> 
                  </div>
                  <span>Manually mark entries as claims with the flag button when you hover over them</span>
                </div>
              </div>
            ) : (
              transcript.map(entry => {
                const { color, name, argumentStyle } = getSpeakerInfo(entry.speakerId);
                return (
                  <TranscriptEntryComponent 
                    key={entry.id} 
                    entry={entry} 
                    speakerColor={color}
                    speakerName={name}
                    argumentStyle={argumentStyle}
                    onMarkAsClaim={() => handleMarkAsClaim(entry.id)}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptDisplay;
