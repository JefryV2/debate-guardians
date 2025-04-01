
import { Speaker } from "@/context/DebateContext";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

interface SpeakerCardProps {
  speaker: Speaker;
  isActive: boolean;
  onClick: () => void;
}

const SpeakerCard = ({ speaker, isActive, onClick }: SpeakerCardProps) => {
  const { name, avatar, accuracyScore, color } = speaker;
  
  return (
    <Card 
      className={cn(
        "w-full cursor-pointer transition-all", 
        isActive ? `border-${color} shadow-lg` : "border-gray-200"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center">
        <div className="relative mb-2">
          <img 
            src={avatar} 
            alt={name} 
            className="w-20 h-20 rounded-full border-2 border-gray-200"
          />
          <div className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
            isActive ? "bg-green-500" : "bg-gray-300"
          )}>
            {isActive ? (
              <Mic className="w-3 h-3 text-white" />
            ) : (
              <MicOff className="w-3 h-3 text-white" />
            )}
          </div>
        </div>
        
        <h3 className="font-medium text-lg">{name}</h3>
        
        <div className="w-full mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Accuracy</span>
            <span>{accuracyScore}%</span>
          </div>
          <Progress 
            value={accuracyScore} 
            className={cn(
              "h-2",
              accuracyScore > 80 ? "bg-green-100" : 
              accuracyScore > 50 ? "bg-yellow-100" : "bg-red-100"
            )}
          />
          <div 
            className={cn(
              "h-full", 
              accuracyScore > 80 ? "bg-green-500" : 
              accuracyScore > 50 ? "bg-yellow-500" : "bg-red-500"
            )} 
            style={{ width: `${accuracyScore}%` }} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerCard;
