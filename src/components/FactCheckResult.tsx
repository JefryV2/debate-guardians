import React from 'react';
import { FactCheck } from '@/context/DebateContext';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';
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
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4 text-green-600" />
        };
      case 'false':
        return {
          text: 'False',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="h-4 w-4 text-red-600" />
        };
      case 'unverified':
        return {
          text: 'Needs Verification',
          className: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />
        };
      default:
        return {
          text: 'Unverified',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-4 w-4 text-gray-600" />
        };
    }
  };

  const verification = getVerificationLabel();

  return (
    <div className="bg-card rounded-xl border border-border p-6 transition-all duration-300 hover:shadow-xl shadow-lg">
      <div className="flex justify-between items-start mb-5">
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-bold shadow-sm ${verification.className}`}>
          {verification.icon}
          <span>{verification.text}</span>
        </div>
        
        {factCheck.confidenceScore && (
          <div className="flex items-center gap-2 text-sm text-foreground bg-muted px-3 py-1.5 rounded-full font-medium">
            <span className="font-bold">Confidence:</span>
            <span className="font-bold bg-card px-2.5 py-1 rounded-full shadow-xs border border-border">{factCheck.confidenceScore}%</span>
            <HelpCircle className="h-4 w-4" />
          </div>
        )}
      </div>

      <p className="text-foreground text-base mb-5 leading-relaxed bg-muted p-4 rounded-xl border border-border">{factCheck.explanation}</p>
      
      {factCheck.source && (
        <div className="flex items-center gap-2.5 mb-5">
          <a 
            href={factCheck.source} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-base text-primary hover:text-primary/80 flex items-center gap-2 font-bold bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl border border-primary/20 transition-colors duration-200"
          >
            <span className="underline underline-offset-2">{factCheck.source.replace(/^https?:\/\//, '').substring(0, 35)}{factCheck.source.length > 35 ? '...' : ''}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      )}

      {factCheck.debunkedStudies && (
        <div className="mt-4 mb-5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-5 rounded-xl shadow-sm">
          <h4 className="text-base font-bold mb-3 text-red-700 flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5" />
            <span>Study Validity Issue</span>
          </h4>
          <p className="text-base text-red-600 leading-relaxed">{factCheck.debunkedStudies}</p>
        </div>
      )}

      {factCheck.alternativePerspectives && factCheck.alternativePerspectives.length > 0 && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl shadow-sm">
          <h4 className="text-base font-bold mb-3 text-blue-700 flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5" />
            <span>Alternative Perspectives</span>
          </h4>
          <ul className="text-base text-blue-600 space-y-2.5">
            {factCheck.alternativePerspectives.map((perspective, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-blue-500 mt-1.5">•</span>
                <span className="leading-relaxed">{perspective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {factCheck.logicalFallacies && factCheck.logicalFallacies.length > 0 && (
        <div className="mt-4 mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-xl shadow-sm">
          <h4 className="text-base font-bold mb-3 text-amber-700 flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5" />
            <span>Logical Fallacies Detected</span>
          </h4>
          <ul className="text-base text-amber-600 space-y-2">
            {factCheck.logicalFallacies.map((fallacy, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-amber-500 mt-1.5">•</span>
                <span className="leading-relaxed">{fallacy}</span>
              </li>
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