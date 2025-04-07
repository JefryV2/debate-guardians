
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useDebate } from '@/context/DebateContext';
import { Shield } from 'lucide-react';

const ToleranceSlider = () => {
  const { toleranceLevel, setToleranceLevel } = useDebate();
  
  const getLevelLabel = () => {
    if (toleranceLevel <= 15) return "Strict";
    if (toleranceLevel <= 35) return "Moderate";
    return "Lenient";
  };

  return (
    <div className="bg-white p-3 rounded-lg border shadow-sm w-64">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium">Fact-Check Tolerance</span>
        <span className="ml-auto text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-medium">
          {getLevelLabel()}
        </span>
      </div>
      <Slider 
        value={[toleranceLevel]} 
        onValueChange={(value) => setToleranceLevel(value[0])}
        min={0}
        max={50}
        step={5}
        className="py-1"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">Strict</span>
        <span className="text-xs text-gray-500">Lenient</span>
      </div>
    </div>
  );
};

export default ToleranceSlider;
