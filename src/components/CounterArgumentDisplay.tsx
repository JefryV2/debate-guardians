
import React from 'react';
import { useDebate } from '@/context/DebateContext';
import { LightbulbIcon, XCircleIcon } from 'lucide-react';

interface CounterArgumentDisplayProps {
  factCheckId: string;
}

const CounterArgumentDisplay: React.FC<CounterArgumentDisplayProps> = ({ factCheckId }) => {
  const { factChecks } = useDebate();
  const factCheck = factChecks.find(fc => fc.id === factCheckId);
  
  if (!factCheck || !factCheck.counterArgument) {
    return null;
  }
  
  return (
    <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
      <div className="flex gap-2 items-start">
        <LightbulbIcon size={16} className="text-debate-violet mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-1">Suggested Counter Argument</h4>
          <p className="text-sm text-slate-600">{factCheck.counterArgument}</p>
        </div>
      </div>
    </div>
  );
};

export default CounterArgumentDisplay;
