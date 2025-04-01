
import { useDebate, FactCheck } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface FactCheckItemProps {
  factCheck: FactCheck;
  claimText: string;
  speakerName: string;
}

const FactCheckItem = ({ factCheck, claimText, speakerName }: FactCheckItemProps) => {
  const { verdict, source, explanation } = factCheck;
  
  const getVerdictIcon = () => {
    switch (verdict) {
      case 'true':
        return <CheckCircle className="text-debate-true h-5 w-5 flex-shrink-0" />;
      case 'false':
        return <XCircle className="text-debate-false h-5 w-5 flex-shrink-0" />;
      default:
        return <AlertCircle className="text-debate-unverified h-5 w-5 flex-shrink-0" />;
    }
  };
  
  const getVerdictClass = () => {
    switch (verdict) {
      case 'true':
        return "bg-green-50 border-green-200";
      case 'false':
        return "bg-red-50 border-red-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };
  
  return (
    <div className={cn("mb-4 p-4 rounded-md border shadow-sm", getVerdictClass())}>
      <div className="flex items-start gap-3">
        {getVerdictIcon()}
        <div className="w-full">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="font-medium cursor-help border-b border-dotted border-gray-400">
                "{claimText.length > 70 ? claimText.substring(0, 70) + '...' : claimText}"
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4">
              <p className="text-sm">{claimText}</p>
            </HoverCardContent>
          </HoverCard>
          <div className="text-sm mt-1 flex items-center gap-2">
            <span className="font-semibold">Speaker:</span> 
            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">{speakerName}</span>
          </div>
          <div className="flex items-center mt-2">
            <span className="font-semibold">Verdict: </span> 
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-white text-xs font-bold",
              verdict === 'true' ? "bg-debate-true" : 
              verdict === 'false' ? "bg-debate-false" : 
              "bg-debate-unverified"
            )}>
              {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
            </span>
          </div>
          <div className="text-sm mt-2"><span className="font-semibold">Source: </span>{source}</div>
          <div className="text-sm mt-2 bg-white/80 p-2 rounded">{explanation}</div>
        </div>
      </div>
    </div>
  );
};

const FactCheckResults = () => {
  const { factChecks, claims, speakers } = useDebate();
  
  // Sort fact checks with newest first
  const sortedFactChecks = [...factChecks].sort((a, b) => {
    return b.id.localeCompare(a.id); // Simple sort by ID as a proxy for recency
  });
  
  // Get claim text for a given claim ID
  const getClaimText = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    return claim?.text || "Unknown claim";
  };
  
  // Get speaker name for a claim
  const getSpeakerName = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return "Unknown speaker";
    
    const speaker = speakers.find(s => s.id === claim.speakerId);
    return speaker?.name || "Unknown speaker";
  };
  
  return (
    <Card className="h-full border-0 shadow-md bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-slate-100">
            <CheckCircle className="h-5 w-5 text-slate-600" />
          </div>
          Fact Check Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px] pr-4">
          <div className="p-4">
            {factChecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-16">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">No fact checks yet</p>
                <p className="text-sm mt-1">Make some claims to see them analyzed here</p>
              </div>
            ) : (
              sortedFactChecks.map(factCheck => (
                <FactCheckItem 
                  key={factCheck.id} 
                  factCheck={factCheck}
                  claimText={getClaimText(factCheck.claimId)}
                  speakerName={getSpeakerName(factCheck.claimId)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FactCheckResults;
