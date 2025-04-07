
import React from 'react';
import { useDebate } from '@/context/DebateContext';
import { Lightbulb } from 'lucide-react';

interface CounterArgumentDisplayProps {
  factCheckId: string;
}

const CounterArgumentDisplay: React.FC<CounterArgumentDisplayProps> = ({ factCheckId }) => {
  const { factChecks } = useDebate();
  const factCheck = factChecks.find(fc => fc.id === factCheckId);
  
  // Only render when factCheck exists and has a counterArgument
  if (!factCheck || !factCheck.counterArgument) {
    return null;
  }
  
  return (
    <div className="mt-3 p-3 rounded-md bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
      <div className="flex gap-2 items-start">
        <div className="bg-purple-200 p-1.5 rounded-full flex-shrink-0">
          <Lightbulb size={14} className="text-purple-700" />
        </div>
        <div>
          <h4 className="text-xs font-medium text-purple-800">
            Suggested Counter Argument
          </h4>
          <p className="text-xs text-purple-700 leading-relaxed mt-1">{factCheck.counterArgument}</p>
        </div>
      </div>
    </div>
  );
};

export default CounterArgumentDisplay;
