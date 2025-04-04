
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useDebate } from '@/context/DebateContext';
import { InfoIcon } from 'lucide-react';

const ToleranceSlider = () => {
  const { toleranceLevel, setToleranceLevel } = useDebate();

  return (
    <div className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100/80">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-slate-700">Fact-Checking Tolerance</h3>
          <InfoIcon 
            size={14} 
            className="text-slate-400 hover:text-slate-600 cursor-help"
            title="Higher tolerance allows for slight numerical inaccuracies and minor differences in claims"
          />
        </div>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-medium">
          {toleranceLevel}%
        </span>
      </div>
      <Slider 
        value={[toleranceLevel]} 
        onValueChange={(value) => setToleranceLevel(value[0])}
        min={0}
        max={50}
        step={5}
        className="my-2"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Strict</span>
        <span>Moderate</span>
        <span>Lenient</span>
      </div>
    </div>
  );
};

export default ToleranceSlider;
