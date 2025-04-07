
import React from 'react';
import { Settings, Mic, MicOff, Info, Zap } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  aiEnabled: boolean;
  setApiKeyDialogOpen: (open: boolean) => void;
  emotionDetectionEnabled: boolean;
  setEmotionDetectionEnabled: (enabled: boolean) => void;
  activeListener: boolean;
  toggleMicrophone: () => void;
}

const Header = ({ 
  aiEnabled, 
  setApiKeyDialogOpen, 
  emotionDetectionEnabled, 
  setEmotionDetectionEnabled,
  activeListener,
  toggleMicrophone
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
      <div className="container mx-auto py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-md">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Debate Guardian
            </h1>
            <p className="text-xs text-gray-500">Real-time fact-checking for honest discussions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">AI</span>
                  <Switch 
                    checked={aiEnabled} 
                    onCheckedChange={() => setApiKeyDialogOpen(true)} 
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Toggle AI-powered fact checking</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Emotion</span>
                  <Switch 
                    checked={emotionDetectionEnabled}
                    onCheckedChange={setEmotionDetectionEnabled}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Enable emotion detection in transcript</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeListener ? "destructive" : "default"}
            className={`rounded-full font-medium flex items-center gap-1.5 ${
              activeListener 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            }`}
            onClick={toggleMicrophone}
          >
            {activeListener ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Start Listening</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
