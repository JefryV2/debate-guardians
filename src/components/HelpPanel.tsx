
import React from 'react';
import { Info } from 'lucide-react';

const HelpPanel = () => {
  return (
    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-6">
      <div className="flex items-start">
        <div className="bg-purple-100 p-2 rounded-full mr-3">
          <Info className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-800 mb-2">How to use Debate Guardian</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
            <div>
              <p className="mb-2 font-medium text-gray-800">Getting Started:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click "Setup AI" to add your API key</li>
                <li>Select a speaker by clicking their card</li>
                <li>Click "Start Listening" and begin speaking</li>
                <li>Make claims to see them fact-checked in real-time</li>
                <li>Manually mark entries as claims with the flag button</li>
              </ol>
            </div>
            
            <div>
              <p className="mb-2 font-medium text-gray-800">Advanced Features:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Adjust fact-checking tolerance for different levels of scrutiny</li>
                <li>Enable emotion detection to analyze speaker sentiment</li>
                <li>View speaker statistics in the Speakers tab</li>
                <li>Explore debate analytics in the Analytics tab</li>
                <li>Export fact-check reports after the session</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
