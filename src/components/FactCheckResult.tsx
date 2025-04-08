
import React from 'react';
import { FactCheck } from '@/context/DebateContext';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';
import CounterArgumentDisplay from './CounterArgumentDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          text: 'Needs Verification',
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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div className={`${verification.className} rounded-full px-2 py-0.5 flex items-center gap-1 text-xs`}>
          {verification.icon}
          <span className="font-medium">{verification.text}</span>
        </div>
        
        {factCheck.confidenceScore && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-gray-500 cursor-help">
                  <span className="font-medium">{factCheck.confidenceScore}% confidence</span>
                  <HelpCircle className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Confidence score reflects the certainty of this assessment. Scores are adjusted based on evidence quality and claim specificity.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-2">{factCheck.explanation}</p>
      
      {factCheck.source && (
        <div className="flex items-center gap-1 mb-3">
          <a 
            href={factCheck.source} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span className="underline underline-offset-2">{factCheck.source.replace(/^https?:\/\//, '').substring(0, 30)}{factCheck.source.length > 30 ? '...' : ''}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      {factCheck.debunkedStudies && (
        <div className="mt-2 mb-3 bg-red-50 border border-red-100 p-2 rounded-md">
          <h4 className="text-xs font-medium mb-1 text-red-700 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Study Validity Issue:</span>
          </h4>
          <p className="text-xs text-red-600">{factCheck.debunkedStudies}</p>
        </div>
      )}

      {factCheck.alternativePerspectives && factCheck.alternativePerspectives.length > 0 && (
        <div className="mt-2 bg-slate-50 p-2 rounded-md">
          <h4 className="text-xs font-medium mb-1 text-gray-700">Alternative Perspectives:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {factCheck.alternativePerspectives.map((perspective, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-purple-500 mt-0.5">•</span>
                <span>{perspective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {factCheck.logicalFallacies && factCheck.logicalFallacies.length > 0 && (
        <div className="mt-2 mb-3 bg-amber-50 border border-amber-100 p-2 rounded-md">
          <h4 className="text-xs font-medium mb-1 text-amber-700 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Logical Fallacies Detected:</span>
          </h4>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {factCheck.logicalFallacies.map((fallacy, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{fallacy}</span>
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
