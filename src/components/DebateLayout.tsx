
import { useState } from "react";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { useDebate } from "@/context/DebateContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, MicOff, Settings, Shield, Users, BarChart2, Lightbulb, 
  FileText, GitCompare, Bug, Sparkles, Info
} from "lucide-react";
import DebateControls from "./DebateControls";
import DebateSpeakers from "./DebateSpeakers";
import DebateContent from "./DebateContent";
import ToleranceSlider from "./ToleranceSlider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

const DebateLayout = () => {
  const { 
    activeListener, 
    setActiveListener,
    clearTranscript,
    debugMode
  } = useDebate();
  
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini-api-key") || "");
  const [aiEnabled, setAiEnabled] = useState(Boolean(localStorage.getItem("gemini-api-key")));

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini-api-key", apiKey.trim());
      setAiEnabled(true);
      toast.success("API key saved", {
        description: "Gemini AI is now enabled for fact-checking"
      });
    } else {
      localStorage.removeItem("gemini-api-key");
      setAiEnabled(false);
      toast.info("API key removed", {
        description: "Using fallback fact-checking system"
      });
    }
    setApiKeyDialogOpen(false);
  };

  const toggleMicrophone = () => {
    if (!activeListener) {
      toast.success("Microphone activated", {
        description: "The debate fact-checking system is now listening."
      });
    } else {
      toast.info("Microphone deactivated", {
        description: "The debate fact-checking system is now paused."
      });
    }
    setActiveListener(!activeListener);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="flex flex-col items-center justify-center p-4">
            <h1 className="text-xl font-bold purple-gradient-text">Debate Guardians</h1>
            <p className="text-xs text-slate-500">AI-powered fact-checking</p>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Controls</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={toggleMicrophone}
                    className={activeListener ? "text-red-500" : "text-green-500"}
                    tooltip="Toggle microphone listening"
                  >
                    {activeListener ? <MicOff size={20} /> : <Mic size={20} />}
                    <span>{activeListener ? "Stop Listening" : "Start Listening"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setApiKeyDialogOpen(true)}
                    tooltip="Configure AI settings"
                  >
                    <Shield size={20} />
                    <span>{aiEnabled ? "AI Enabled" : "Setup AI"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => clearTranscript()}
                    tooltip="Clear all transcript data"
                  >
                    <FileText size={20} />
                    <span>Clear Transcript</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            
            <Separator className="my-4" />
            
            <SidebarGroup>
              <SidebarGroupLabel>Debate Setup</SidebarGroupLabel>
              <div className="px-3 py-2">
                <ToleranceSlider />
              </div>
              <div className="px-3 mt-4">
                <DebateControls />
              </div>
            </SidebarGroup>
            
            <Separator className="my-4" />
            
            <SidebarGroup>
              <SidebarGroupLabel>Speakers</SidebarGroupLabel>
              <div className="px-3 py-2">
                <DebateSpeakers />
              </div>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4 text-center text-xs text-slate-500">
            <p>Debate Guardians v2.0</p>
            <p>Using {aiEnabled ? "Gemini AI" : "Web Speech API"}</p>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="p-4 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold purple-gradient-text">Debate Guardians</h1>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Info size={16} />
              <span className="hidden sm:inline">Help</span>
            </Button>
          </div>
          
          <DebateContent />
          
          <div className="mt-6 p-5 neo-card border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm rounded-xl">
            <div className="flex items-start gap-3">
              <div className="bg-violet-100 p-2 rounded-full">
                <Info className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Using the Debate Guardian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
                  <div>
                    <p className="mb-2 font-medium text-slate-900">Getting Started:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Select a speaker from the sidebar</li>
                      <li>Click "Start Listening" to begin</li>
                      <li>Make claims to see fact-checking in real-time</li>
                      <li>Adjust tolerance level as needed</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="mb-2 font-medium text-slate-900">Advanced Features:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Continuous analysis mode</li>
                      <li>Logical fallacy detection</li>
                      <li>Alternative perspectives</li>
                      <li>Counter arguments</li>
                      <li>Speaker statistics tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md neo-card border-0">
          <DialogHeader>
            <DialogTitle>Set up Gemini AI Integration</DialogTitle>
            <DialogDescription>
              Enter your Google Gemini API key to enable advanced AI-powered fact-checking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <Input 
                id="gemini-api-key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="col-span-3 border-slate-200"
              />
              <p className="text-sm text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              onClick={saveApiKey}
              className="purple-gradient"
            >
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DebateLayout;
