import React from 'react';
import { Mic, MicOff, Zap, Brain, Shield } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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
    <header className="border-b border-border sticky top-0 z-50 bg-gradient-to-r from-background to-card shadow-lg">
      <div className="max-w-8xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/debate.png.png" 
                alt="Debate Guardian Logo" 
                className="h-12 w-12 object-contain rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Debate Guardian</h1>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-3">
            {/* AI Toggle */}
            <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border shadow-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI</span>
              <Switch 
                checked={aiEnabled} 
                onCheckedChange={() => setApiKeyDialogOpen(true)}
                className="data-[state=checked]:bg-primary h-5 w-9"
              />
            </div>

            {/* Emotion Detection */}
            <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border shadow-sm">
              <span className="text-sm">🎭</span>
              <span className="text-sm font-medium text-foreground">Emotion</span>
              <Switch 
                checked={emotionDetectionEnabled}
                onCheckedChange={setEmotionDetectionEnabled}
                className="data-[state=checked]:bg-secondary h-5 w-9"
              />
            </div>

            {/* Main Action Button */}
            <Button
              onClick={toggleMicrophone}
              className={`rounded-lg font-bold px-4 py-2 transition-all duration-300 shadow-md text-sm transform hover:scale-105 ${
                activeListener 
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/30" 
                  : "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-primary/30"
              }`}
            >
              {activeListener ? (
                <>
                  <MicOff className="h-4 w-4 mr-1.5" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-1.5" />
                  Start
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