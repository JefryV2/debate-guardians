
import React from 'react';
import { Settings, Mic, MicOff, Zap, Brain } from 'lucide-react';
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
    <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Debate Guardian</h1>
              <p className="text-sm text-gray-500">Real-time fact checking</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-6">
            {/* AI Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">AI</span>
              <Switch 
                checked={aiEnabled} 
                onCheckedChange={() => setApiKeyDialogOpen(true)}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Emotion Detection */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
              <span className="text-sm">🎭</span>
              <span className="text-sm font-medium text-gray-700">Emotions</span>
              <Switch 
                checked={emotionDetectionEnabled}
                onCheckedChange={setEmotionDetectionEnabled}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Main Action Button */}
            <Button
              onClick={toggleMicrophone}
              className={`rounded-full font-semibold px-6 py-3 transition-all duration-200 ${
                activeListener 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {activeListener ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
