
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
    <div className="mt-3 p-4 rounded-xl glass-card animate-fade-in">
      <div className="flex gap-3 items-start">
        <div className="bg-debate-twitch bg-opacity-20 p-2 rounded-full flex-shrink-0">
          <Lightbulb size={16} className="text-debate-twitch" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <span className="bg-gradient-to-r from-debate-twitch to-purple-400 bg-clip-text text-transparent">
              Suggested Counter Argument
            </span>
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{factCheck.counterArgument}</p>
        </div>
      </div>
    </div>
  );
};

export default CounterArgumentDisplay;
