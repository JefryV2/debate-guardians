
import React from 'react';
import { Settings, Mic, MicOff } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

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
    <header className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-md">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Debate Guardian</h1>
            <p className="text-xs text-gray-500">Real-time fact-checking for honest discussions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">AI</span>
            <Switch 
              checked={aiEnabled} 
              onCheckedChange={() => setApiKeyDialogOpen(true)} 
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Emotion</span>
            <Switch 
              checked={emotionDetectionEnabled}
              onCheckedChange={setEmotionDetectionEnabled}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeListener ? "destructive" : "default"}
            className="rounded-full bg-red-500 hover:bg-red-600 font-medium flex items-center gap-1"
            onClick={toggleMicrophone}
          >
            {activeListener ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Stop Listening</span>
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
