
import { useState } from "react";
import { useDebate } from "@/context/DebateContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GitCompare, Lightbulb, FileText, Bug } from "lucide-react";

const DebateControls = () => {
  const { 
    debugMode, 
    setDebugMode,
    continuousAnalysisMode,
    setContinuousAnalysisMode
  } = useDebate();
  
  // These would typically be controlled from the context, but for now we'll use local state
  const [fallacyDetectionEnabled, setFallacyDetectionEnabled] = useState(true);
  const [knowledgeGapDetectionEnabled, setKnowledgeGapDetectionEnabled] = useState(true);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-slate-700">Analysis Features</h4>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="continuous-analysis" 
          checked={continuousAnalysisMode}
          onCheckedChange={setContinuousAnalysisMode}
          className="data-[state=checked]:bg-violet-600"
        />
        <Label htmlFor="continuous-analysis" className="text-sm flex items-center gap-1">
          <GitCompare className="h-3 w-3" />
          Continuous Analysis
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="fallacy-detection" 
          checked={fallacyDetectionEnabled}
          onCheckedChange={setFallacyDetectionEnabled}
          className="data-[state=checked]:bg-violet-600"
        />
        <Label htmlFor="fallacy-detection" className="text-sm flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Fallacy Detection
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="knowledge-gap-detection" 
          checked={knowledgeGapDetectionEnabled}
          onCheckedChange={setKnowledgeGapDetectionEnabled}
          className="data-[state=checked]:bg-violet-600"
        />
        <Label htmlFor="knowledge-gap-detection" className="text-sm flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Knowledge Gap Detection
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="debug-mode" 
          checked={debugMode}
          onCheckedChange={setDebugMode}
          className="data-[state=checked]:bg-violet-600"
        />
        <Label htmlFor="debug-mode" className="text-sm flex items-center gap-1">
          <Bug className="h-3 w-3" />
          Debug Mode
        </Label>
      </div>
    </div>
  );
};

export default DebateControls;
