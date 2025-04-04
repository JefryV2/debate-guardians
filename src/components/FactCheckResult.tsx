
import React from 'react';
import { FactCheck } from '@/context/DebateContext';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import CounterArgumentDisplay from './CounterArgumentDisplay';

interface FactCheckResultProps {
  factCheck: FactCheck;
}

const FactCheckResult = ({ factCheck }: FactCheckResultProps) => {
  // Add a safety check at the top to ensure factCheck is defined
  if (!factCheck) {
    return null;
  }

  const getIcon = () => {
    switch (factCheck.verdict) {
      case 'true':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'false':
        return <XCircle className="text-red-500" size={20} />;
      case 'unverified':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return null;
    }
  };

  const getVerdictText = () => {
    switch (factCheck.verdict) {
      case 'true':
        return 'True';
      case 'false':
        return 'False';
      case 'unverified':
        return 'Unverified';
      default:
        return 'Unknown';
    }
  };

  const getConfidenceColor = () => {
    if (factCheck.confidenceScore === undefined) return 'text-gray-500';
    if (factCheck.confidenceScore > 75) return 'text-green-500';
    if (factCheck.confidenceScore > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="neo-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <h3 className="font-semibold text-lg">{getVerdictText()}</h3>
        {factCheck.confidenceScore !== undefined && (
          <span className={`text-sm ${getConfidenceColor()}`}>
            (Confidence: {factCheck.confidenceScore}%)
          </span>
        )}
      </div>
      <p className="text-gray-700 mb-2">{factCheck.explanation}</p>
      {factCheck.source && (
        <div className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
          Source:
          <a href={factCheck.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5">
            {factCheck.source}
            <ExternalLink size={14} />
          </a>
        </div>
      )}
      {factCheck.alternativePerspectives && factCheck.alternativePerspectives.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium">Alternative Perspectives:</h4>
          <ul>
            {factCheck.alternativePerspectives.map((perspective, index) => (
              <li key={index} className="text-gray-600 text-sm">{perspective}</li>
            ))}
          </ul>
        </div>
      )}
      {factCheck.logicalFallacies && factCheck.logicalFallacies.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium">Logical Fallacies:</h4>
          <ul>
            {factCheck.logicalFallacies.map((fallacy, index) => (
              <li key={index} className="text-red-600 text-sm">{fallacy}</li>
            ))}
          </ul>
        </div>
      )}
      {factCheck.debunkedStudies && (
        <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-700">Debunked Study Alert:</h4>
            <p className="text-sm text-red-600">{factCheck.debunkedStudies}</p>
          </div>
        </div>
      )}
      
      {/* Add counter argument display */}
      <CounterArgumentDisplay factCheckId={factCheck.id} />
    </div>
  );
};

export default FactCheckResult;
