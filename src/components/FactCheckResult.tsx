
import React from 'react';
import { FactCheck } from '@/context/DebateContext';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import CounterArgumentDisplay from './CounterArgumentDisplay';

interface FactCheckResultProps {
  factCheck: FactCheck;
}

const FactCheckResult = ({ factCheck }: FactCheckResultProps) => {
  if (!factCheck) {
    return null;
  }

  const getVerificationLabel = () => {
    switch (factCheck.verdict) {
      case 'true':
        return {
          text: 'Verified',
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-600" />
        };
      case 'false':
        return {
          text: 'False',
          className: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-4 w-4 text-red-600" />
        };
      case 'unverified':
        return {
          text: 'Partially True',
          className: 'bg-amber-100 text-amber-800',
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />
        };
      default:
        return {
          text: 'Unverified',
          className: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="h-4 w-4 text-gray-600" />
        };
    }
  };

  const verification = getVerificationLabel();
  // Remove references to timestamp which doesn't exist in FactCheck

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`${verification.className} rounded-md px-2 py-1 flex items-center gap-1`}>
            {verification.icon}
            <span className="text-xs font-medium">{verification.text}</span>
          </div>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">"{factCheck.explanation}"</h3>
      
      <p className="text-sm text-gray-700 mb-4">{factCheck.explanation}</p>
      
      {factCheck.source && (
        <div className="flex flex-wrap gap-2 mb-3">
          <a 
            href={factCheck.source} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-purple-600 hover:underline flex items-center gap-1"
          >
            {factCheck.source.replace(/^https?:\/\//, '')}
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {factCheck.alternativePerspectives && factCheck.alternativePerspectives.length > 0 && (
        <div className="mt-2 text-sm">
          <h4 className="font-medium mb-1">Alternative Perspectives:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {factCheck.alternativePerspectives.map((perspective, index) => (
              <li key={index}>{perspective}</li>
            ))}
          </ul>
        </div>
      )}

      {factCheck.counterArgument && (
        <CounterArgumentDisplay factCheckId={factCheck.id} />
      )}
    </div>
  );
};

export default FactCheckResult;
