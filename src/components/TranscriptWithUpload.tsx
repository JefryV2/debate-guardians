import React from 'react';
import FileUploadPanel from './FileUploadPanel';
import TranscriptDisplay from './TranscriptDisplay';
import ToleranceSlider from './ToleranceSlider';
import { Card, CardContent } from '@/components/ui/card';
import { CustomTabs } from '@/components/CustomTabs';

const TranscriptWithUpload = () => {
  return (
    <div className="h-full flex flex-col">
      <CustomTabs defaultValue="live" className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-5 bg-card rounded-t-xl border-b border-border">
          <CustomTabs.List>
            <CustomTabs.Trigger 
              value="live" 
              text="Live Transcript"
            />
            <CustomTabs.Trigger 
              value="upload" 
              text="Upload File"
            />
          </CustomTabs.List>
          
          <div className="w-64">
            <ToleranceSlider />
          </div>
        </div>
        
        <CustomTabs.Content value="live" className="flex-1">
          <div className="h-full p-5 bg-card rounded-b-2xl">
            <TranscriptDisplay />
          </div>
        </CustomTabs.Content>
        
        <CustomTabs.Content value="upload" className="flex-1">
          <div className="h-full p-5 bg-card rounded-b-2xl">
            <FileUploadPanel />
          </div>
        </CustomTabs.Content>
      </CustomTabs>
    </div>
  );
};

export default TranscriptWithUpload;