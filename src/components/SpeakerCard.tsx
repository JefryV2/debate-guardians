
import { Speaker } from "@/context/DebateContext";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { EmotionType } from "@/services/speechService";

interface SpeakerCardProps {
  speaker: Speaker;
  isActive: boolean;
  onClick: () => void;
  emotion?: EmotionType;
}

const SpeakerCard = ({ speaker, isActive, onClick, emotion }: SpeakerCardProps) => {
  const { name, avatar, accuracyScore, color } = speaker;
  
  const getBorderColor = () => {
    if (isActive) {
      return `border-${color} shadow-md shadow-${color}/20`;
    }
    return "border-gray-200";
  };
  
  const getEmotionLabel = () => {
    if (!emotion) return null;
    
    return (
      <div className={cn(
        "absolute top-0 right-0 text-xs font-medium py-1 px-2 rounded-full transform translate-x-1/3 -translate-y-1/3",
        emotion === 'angry' ? "bg-red-500 text-white" :
        emotion === 'happy' ? "bg-green-500 text-white" :
        emotion === 'sad' ? "bg-blue-500 text-white" :
        emotion === 'excited' ? "bg-yellow-500 text-white" :
        emotion === 'frustrated' ? "bg-orange-500 text-white" :
        emotion === 'uncertain' ? "bg-purple-500 text-white" :
        "bg-gray-500 text-white"
      )}>
        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
      </div>
    );
  };
  
  // Get progress color based on accuracy score
  const getProgressColor = () => {
    if (accuracyScore > 80) return "bg-green-500";
    if (accuracyScore > 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <Card 
      className={cn(
        "w-full cursor-pointer transition-all hover:scale-[1.02] duration-200", 
        getBorderColor()
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center relative">
        <div className="relative mb-3 mt-2">
          <div className={cn(
            "w-20 h-20 rounded-full overflow-hidden border-2",
            isActive ? `border-${color}` : "border-gray-200"
          )}>
            <img 
              src={avatar} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          </div>
          {getEmotionLabel()}
          <div className={cn(
            "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center",
            isActive ? `bg-${color}` : "bg-gray-300"
          )}>
            {isActive ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        
        <h3 className="font-medium text-lg">{name}</h3>
        
        <div className="w-full mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Accuracy</span>
            <span className={cn(
              accuracyScore > 80 ? "text-green-600 font-semibold" : 
              accuracyScore > 50 ? "text-yellow-600 font-semibold" : 
              "text-red-600 font-semibold"
            )}>
              {accuracyScore}%
            </span>
          </div>
          <Progress 
            value={accuracyScore} 
            className={cn("h-2", getProgressColor())}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerCard;
