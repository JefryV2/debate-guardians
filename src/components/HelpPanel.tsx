import React from 'react';
import { Info } from 'lucide-react';

const HelpPanel = () => {
  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
      <div className="flex items-start">
        <div className="bg-blue-100 p-1.5 rounded-full mr-2 mt-0.5">
          <Info className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-800 text-sm mb-1">How to use Debate Guardian</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <div>
              <p className="mb-1 font-medium text-gray-700">Getting Started:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Click "Setup AI" to add your API key</li>
                <li>Select a speaker by clicking their card</li>
                <li>Click "Start" and begin speaking</li>
                <li>Make claims to see them fact-checked</li>
              </ol>
            </div>
            
            <div>
              <p className="mb-1 font-medium text-gray-700">Advanced Features:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Adjust fact-checking tolerance</li>
                <li>Enable emotion detection</li>
                <li>View speaker statistics</li>
                <li>Explore debate analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;