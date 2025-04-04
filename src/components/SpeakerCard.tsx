
import { Speaker } from "@/context/DebateContext";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Award, BadgeCheck, AlertTriangle } from "lucide-react";
import { EmotionType } from "@/services/speechService";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SpeakerCardProps {
  speaker: Speaker;
  isActive: boolean;
  onClick: () => void;
  emotion?: EmotionType;
}

const SpeakerCard = ({ speaker, isActive, onClick, emotion }: SpeakerCardProps) => {
  const { name, avatar, accuracyScore, color, argumentPatterns } = speaker;
  
  const getEmotionLabel = () => {
    if (!emotion) return null;
    
    const emotionColors: Record<EmotionType, string> = {
      angry: "from-red-500 to-red-600",
      happy: "from-green-500 to-green-600",
      sad: "from-blue-500 to-blue-600",
      excited: "from-yellow-500 to-yellow-600",
      frustrated: "from-orange-500 to-orange-600",
      uncertain: "from-purple-500 to-purple-600",
      neutral: "from-gray-500 to-gray-600"
    };
    
    return (
      <div className={cn(
        "absolute top-0 right-0 text-xs font-medium py-1 px-2 rounded-full transform translate-x-1/3 -translate-y-1/3 shadow-md text-white",
        `bg-gradient-to-r ${emotionColors[emotion]}`
      )}>
        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
      </div>
    );
  };
  
  // Get progress color based on accuracy score
  const getProgressColor = () => {
    if (accuracyScore > 80) return "bg-gradient-to-r from-green-500 to-emerald-600";
    if (accuracyScore > 50) return "bg-gradient-to-r from-yellow-500 to-amber-600";
    return "bg-gradient-to-r from-red-500 to-rose-600";
  };

  // Get argumentation style badge
  const getArgumentStyleBadge = () => {
    if (!argumentPatterns?.overallBias) return null;
    
    const getBadgeColor = () => {
      const styles: Record<string, string> = {
        factual: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        scientific: 'bg-blue-100 text-blue-800 border-blue-200',
        emotional: 'bg-amber-100 text-amber-800 border-amber-200',
        political: 'bg-purple-100 text-purple-800 border-purple-200',
        sensationalist: 'bg-rose-100 text-rose-800 border-rose-200'
      };
      
      return styles[argumentPatterns.overallBias] || 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const getArgumentIcon = () => {
      switch(argumentPatterns.overallBias) {
        case 'factual': return <BadgeCheck className="h-3 w-3" />;
        case 'scientific': return <Award className="h-3 w-3" />;
        case 'sensationalist': return <AlertTriangle className="h-3 w-3" />;
        default: return null;
      }
    };
    
    return (
      <Badge variant="outline" className={`text-xs mt-1 ${getBadgeColor()} flex items-center gap-1`}>
        {getArgumentIcon()}
        {argumentPatterns.overallBias.charAt(0).toUpperCase() + argumentPatterns.overallBias.slice(1)} style
      </Badge>
    );
  };
  
  return (
    <Card 
      className={cn(
        "relative w-full cursor-pointer transition-all hover:scale-[1.02] duration-200 overflow-hidden glass-card rounded-xl",
        isActive && "ring-2 ring-violet-500 shadow-lg shadow-violet-500/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col items-center relative">
        <div className="relative mb-3 mt-1">
          <div className={cn(
            "w-20 h-20 rounded-full overflow-hidden border-2 shadow-md",
            isActive ? "border-violet-500" : "border-gray-200"
          )}>
            <img 
              src={avatar} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          </div>
          {getEmotionLabel()}
          <div className={cn(
            "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md",
            isActive 
              ? "purple-gradient" 
              : "bg-gradient-to-r from-gray-300 to-gray-400"
          )}>
            {isActive ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        
        <h3 className="font-medium text-lg">{name}</h3>
        {getArgumentStyleBadge()}
        
        <div className="w-full mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Accuracy</span>
            <span className={cn(
              "font-medium",
              accuracyScore > 80 ? "text-green-600" : 
              accuracyScore > 50 ? "text-yellow-600" : 
              "text-red-600"
            )}>
              {accuracyScore}%
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <Progress 
                    value={accuracyScore} 
                    className={cn("h-2.5", getProgressColor())}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Factual accuracy score based on previous claims</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerCard;
