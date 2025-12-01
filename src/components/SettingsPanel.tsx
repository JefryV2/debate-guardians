import { useState, useEffect } from "react";
import { useDebate } from "@/context/DebateContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Shield, Zap, Star, Key, Settings, Bug, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";
import { FactCheckMode } from "@/services/hybridFactCheckService";

const SettingsPanel = () => {
  const { debugMode, setDebugMode, continuousAnalysisMode, setContinuousAnalysisMode } = useDebate();
  
  const [factCheckMode, setFactCheckMode] = useState<FactCheckMode>("hybrid");
  const [apiKey, setApiKey] = useState("");
  const [claimBusterApiKey, setClaimBusterApiKey] = useState("");
  
  useEffect(() => {
    // Load settings from localStorage
    const savedMode = localStorage.getItem("fact-check-mode") as FactCheckMode || "hybrid";
    const savedApiKey = localStorage.getItem("gemini-api-key") || "";
    const savedClaimBusterApiKey = localStorage.getItem("claimbuster-api-key") || "";
    
    setFactCheckMode(savedMode);
    setApiKey(savedApiKey);
    setClaimBusterApiKey(savedClaimBusterApiKey);
  }, []);
  
  const saveSettings = () => {
    localStorage.setItem("fact-check-mode", factCheckMode);
    localStorage.setItem("gemini-api-key", apiKey);
    localStorage.setItem("claimbuster-api-key", claimBusterApiKey);
    
    toast.success("Settings saved", {
      description: "Your preferences have been updated successfully."
    });
  };
  
  return (
    <div className="space-y-8 p-2">
      <div className="text-center mb-10 pt-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Settings</h1>
        <p className="text-muted-foreground mt-3 text-lg">Configure your Debate Guardian preferences</p>
      </div>
      
      <Card className="shadow-xl rounded-xl border border-border hover:shadow-2xl transition-all duration-300 bg-card">
        <CardHeader className="bg-muted rounded-t-xl border-b border-border pb-6">
          <CardTitle className="text-2xl text-foreground flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            Fact Checking Preferences
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-base">
            Choose how you want claims to be verified during debates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="space-y-6">
            <Label className="text-xl font-bold text-foreground flex items-center gap-2.5">
              <Zap className="h-6 w-6 text-amber-500" />
              Fact Checking Mode
            </Label>
            <RadioGroup 
              value={factCheckMode} 
              onValueChange={(value: string) => setFactCheckMode(value as FactCheckMode)}
              className="space-y-5"
            >
              <div className="flex items-start space-x-5 p-6 rounded-xl border border-border hover:bg-muted transition-all hover:shadow-md cursor-pointer">
                <RadioGroupItem value="claimbuster" id="claimbuster" className="mt-1.5 h-5 w-5" />
                <Label htmlFor="claimbuster" className="font-semibold text-lg">
                  ClaimBuster Only
                  <p className="text-base text-muted-foreground font-normal mt-2">
                    Uses ClaimBuster to identify factual claims and basic rule-based analysis
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-5 p-6 rounded-xl border-2 border-primary bg-muted transition-all cursor-pointer shadow-md">
                <RadioGroupItem value="hybrid" id="hybrid" className="mt-1.5 h-5 w-5 text-primary" />
                <Label htmlFor="hybrid" className="font-semibold text-lg">
                  Hybrid Mode (Recommended)
                  <p className="text-base text-muted-foreground font-normal mt-2">
                    Combines ClaimBuster, web search, source analysis, and Gemini AI when available
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                    <Star className="h-3.5 w-3.5" />
                    Most Accurate
                  </div>
                </Label>
              </div>
              
              <div className="flex items-start space-x-5 p-6 rounded-xl border border-border hover:bg-muted transition-all hover:shadow-md cursor-pointer">
                <RadioGroupItem value="gemini" id="gemini" className="mt-1.5 h-5 w-5" />
                <Label htmlFor="gemini" className="font-semibold text-lg">
                  Gemini AI Only
                  <p className="text-base text-muted-foreground font-normal mt-2">
                    Uses only Gemini AI for fact-checking (requires API key)
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-6 pt-6">
            <Label className="text-xl font-bold text-foreground flex items-center gap-2.5">
              <Key className="h-6 w-6 text-primary" />
              API Keys
            </Label>
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium text-foreground mb-2 block">Gemini API Key</Label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base shadow-sm hover:shadow-md bg-background"
                />
                <p className="text-muted-foreground bg-card p-4 rounded-lg border border-border mt-2">
                  Required for Gemini AI fact-checking. Get your key from{' '}
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              
              <div>
                <Label className="text-base font-medium text-foreground mb-2 block">ClaimBuster API Key</Label>
                <input
                  type="password"
                  value={claimBusterApiKey}
                  onChange={(e) => setClaimBusterApiKey(e.target.value)}
                  placeholder="Enter your ClaimBuster API key"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base shadow-sm hover:shadow-md bg-background"
                />
                <p className="text-muted-foreground bg-card p-4 rounded-lg border border-border mt-2">
                  Required for ClaimBuster fact-checking. Get your key from{' '}
                  <a 
                    href="https://idir.uta.edu/claimbuster/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    ClaimBuster Website
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl rounded-xl border border-border hover:shadow-2xl transition-all duration-300 bg-card">
        <CardHeader className="bg-muted rounded-t-xl border-b border-border pb-6">
          <CardTitle className="text-2xl text-foreground flex items-center gap-3">
            <Settings className="h-7 w-7 text-muted-foreground" />
            System Preferences
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-base">
            Configure how the debate system behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="flex items-center justify-between p-6 rounded-xl border border-border hover:bg-muted transition-all hover:shadow-md">
            <div>
              <Label className="font-semibold text-lg flex items-center gap-2.5">
                <Bug className="h-5 w-5 text-primary" />
                Debug Mode
              </Label>
              <p className="text-base text-muted-foreground mt-2">
                Show detailed information about claim processing
              </p>
            </div>
            <Switch
              checked={debugMode}
              onCheckedChange={setDebugMode}
              className="data-[state=checked]:bg-primary h-6 w-11"
            />
          </div>
          
          <div className="flex items-center justify-between p-6 rounded-xl border border-border hover:bg-muted transition-all hover:shadow-md">
            <div>
              <Label className="font-semibold text-lg flex items-center gap-2.5">
                <RefreshCw className="h-5 w-5 text-primary" />
                Continuous Analysis
              </Label>
              <p className="text-base text-muted-foreground mt-2">
                Automatically analyze claims as they are spoken
              </p>
            </div>
            <Switch
              checked={continuousAnalysisMode}
              onCheckedChange={setContinuousAnalysisMode}
              className="data-[state=checked]:bg-primary h-6 w-11"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-6">
        <Button 
          onClick={saveSettings} 
          className="rounded-xl px-8 py-3.5 shadow-lg text-base font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary text-white transition-all duration-300 transform hover:scale-105"
        >
          <Save className="h-5 w-5 mr-2.5" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;