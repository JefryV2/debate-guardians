
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
    <div className="mt-3 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-3 items-start">
        <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
          <Lightbulb size={16} className="text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-1">
            Suggested Counter Argument
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">{factCheck.counterArgument}</p>
        </div>
      </div>
    </div>
  );
};

export default CounterArgumentDisplay;
