
import { useState } from "react";
import { useDebate } from "@/context/DebateContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { BarChart2, FileText, AlertTriangle } from "lucide-react";
import TranscriptDisplay from "./TranscriptDisplay";
import FactCheckResult from "./FactCheckResult";
import SpeakerStats from "./SpeakerStats";

const DebateContent = () => {
  const { speakers, factChecks } = useDebate();
  const [activeTab, setActiveTab] = useState("transcript");
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="transcript" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-3 h-10">
          <TabsTrigger value="transcript" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Transcript</span>
          </TabsTrigger>
          <TabsTrigger value="factchecks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Fact Checks</span>
            {factChecks.length > 0 && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-2 text-xs font-medium text-violet-900">
                {factChecks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Statistics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transcript" className="mt-0">
          <Card className="neo-card border-0 p-4">
            <h2 className="text-lg font-semibold mb-3 text-slate-800">Debate Transcript</h2>
            <TranscriptDisplay />
          </Card>
        </TabsContent>
        
        <TabsContent value="factchecks" className="mt-0">
          <Card className="neo-card border-0 p-4">
            <h2 className="text-lg font-semibold mb-3 text-slate-800">Fact Check Results</h2>
            <div className="space-y-4">
              {factChecks.length > 0 ? (
                factChecks.map(factCheck => (
                  <FactCheckResult key={factCheck.id} factCheck={factCheck} />
                ))
              ) : (
                <div className="text-center p-8 text-slate-500">
                  No fact checks yet. Start speaking to generate some claims!
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-0">
          <Card className="neo-card border-0 p-4">
            <h2 className="text-lg font-semibold mb-3 text-slate-800">Speaker Statistics</h2>
            <div className="space-y-4">
              {speakers.map((speaker) => (
                <SpeakerStats key={speaker.id} speaker={speaker} />
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DebateContent;
