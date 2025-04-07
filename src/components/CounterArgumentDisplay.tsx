
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
    <div className="mt-3 p-3 rounded-lg bg-debate-darkHighlight border border-gray-700">
      <div className="flex gap-2 items-start">
        <Lightbulb size={16} className="text-debate-twitch mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-gray-200 mb-1">Suggested Counter Argument</h4>
          <p className="text-sm text-gray-300">{factCheck.counterArgument}</p>
        </div>
      </div>
    </div>
  );
};

export default CounterArgumentDisplay;
