import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useDebate } from '@/context/DebateContext';
import { Shield, HelpCircle } from 'lucide-react';

const ToleranceSlider = () => {
  const { toleranceLevel, setToleranceLevel } = useDebate();
  
  const getLevelLabel = () => {
    if (toleranceLevel <= 15) return "Strict";
    if (toleranceLevel <= 35) return "Moderate";
    return "Lenient";
  };

  return (
    <div className="bg-card p-3 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <Shield className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">Tolerance: {getLevelLabel()}</span>
        <div className="group relative ml-auto">
          <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded-lg p-2 shadow-xl z-10">
            <div className="font-medium mb-1">Tolerance Setting</div>
            <div className="font-normal">Adjusts how strictly claims are matched. Higher tolerance allows for more variation in phrasing.</div>
          </div>
        </div>
      </div>
      <Slider 
        value={[toleranceLevel]} 
        onValueChange={(value) => setToleranceLevel(value[0])}
        min={0}
        max={50}
        step={5}
        className="py-1"
      />
      <div className="flex justify-between mt-1 text-muted-foreground">
        <span className="text-xs text-gray-500">Strict</span>
        <span className="text-xs text-gray-500">Lenient</span>
      </div>
    </div>
  );
};

export default ToleranceSlider;