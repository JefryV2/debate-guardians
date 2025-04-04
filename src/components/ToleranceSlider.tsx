
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useDebate } from '@/context/DebateContext';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ToleranceSlider = () => {
  const { toleranceLevel, setToleranceLevel } = useDebate();

  // Map tolerance levels to descriptive text
  const getToleranceText = () => {
    if (toleranceLevel <= 15) return "Strict";
    if (toleranceLevel <= 30) return "Moderate";
    return "Lenient";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-slate-700">Fact-Checking Tolerance</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info 
                  size={14} 
                  className="text-slate-400 hover:text-slate-600 cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent>
                Higher tolerance allows for slight numerical inaccuracies and minor differences in claims
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-medium">
            {toleranceLevel}%
          </span>
          <span className="text-xs text-violet-600 font-medium">
            ({getToleranceText()})
          </span>
        </div>
      </div>
      
      <Slider 
        value={[toleranceLevel]} 
        onValueChange={(value) => setToleranceLevel(value[0])}
        min={0}
        max={50}
        step={5}
        className="my-2"
      />
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>Strict</span>
        <span>Moderate</span>
        <span>Lenient</span>
      </div>
    </div>
  );
};

export default ToleranceSlider;
