
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useDebate } from '@/context/DebateContext';

const ToleranceSlider = () => {
  const { toleranceLevel, setToleranceLevel } = useDebate();
  
  const getLevelLabel = () => {
    if (toleranceLevel <= 15) return "Strict";
    if (toleranceLevel <= 35) return "Moderate";
    return "Lenient";
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Fact-Check Tolerance:</span>
        <span className="text-sm text-purple-600 font-medium">{getLevelLabel()}</span>
      </div>
      <Slider 
        value={[toleranceLevel]} 
        onValueChange={(value) => setToleranceLevel(value[0])}
        min={0}
        max={50}
        step={5}
        className="my-2"
      />
    </div>
  );
};

export default ToleranceSlider;
