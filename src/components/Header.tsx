
import React from 'react';
import { Settings, Mic, MicOff, Info, Zap, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 border-b-4 border-yellow-400 shadow-lg">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-200">
            <Mic className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              Debate Guardian
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            </h1>
            <p className="text-sm text-purple-100 font-medium">Making debates fun and fact-filled! 🎉</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-bold text-white">AI Magic</span>
                  <Switch 
                    checked={aiEnabled} 
                    onCheckedChange={() => setApiKeyDialogOpen(true)} 
                    className="data-[state=checked]:bg-yellow-400"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-purple-600 text-white border-yellow-400">
                <p className="text-xs">Toggle AI-powered fact checking ✨</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-lg">😊</span>
                  <span className="text-sm font-bold text-white">Emotions</span>
                  <Switch 
                    checked={emotionDetectionEnabled}
                    onCheckedChange={setEmotionDetectionEnabled}
                    className="data-[state=checked]:bg-pink-400"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-pink-600 text-white border-yellow-400">
                <p className="text-xs">Detect emotions in the conversation 💭</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-white/20 border-2 border-white/30 text-white hover:bg-white hover:text-purple-600 transform hover:scale-110 transition-all duration-200"
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button
            variant={activeListener ? "destructive" : "default"}
            className={`rounded-full font-bold text-lg px-6 py-3 flex items-center gap-2 transform hover:scale-105 transition-all duration-200 shadow-lg ${
              activeListener 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white"
            }`}
            onClick={toggleMicrophone}
          >
            {activeListener ? (
              <>
                <MicOff className="h-5 w-5" />
                <span>Stop Recording</span>
                <span className="text-xl">🛑</span>
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                <span>Start Listening</span>
                <span className="text-xl">🎤</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
