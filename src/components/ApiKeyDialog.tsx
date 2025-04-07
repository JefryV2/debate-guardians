
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  saveApiKey: () => void;
}

const ApiKeyDialog = ({ 
  open, 
  onOpenChange, 
  apiKey, 
  setApiKey, 
  saveApiKey 
}: ApiKeyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set up AI Integration</DialogTitle>
          <DialogDescription>
            Enter your API key to enable advanced AI-powered fact-checking.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input 
              id="api-key" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
            <p className="text-sm text-gray-500">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={saveApiKey}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
