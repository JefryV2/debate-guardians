
import { useDebate, FactCheck } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
        return <CheckCircle className="text-debate-true h-5 w-5" />;
      case 'false':
        return <XCircle className="text-debate-false h-5 w-5" />;
      default:
        return <AlertCircle className="text-debate-unverified h-5 w-5" />;
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
    <div className={cn("mb-4 p-3 rounded-md border", getVerdictClass())}>
      <div className="flex items-start gap-2">
        {getVerdictIcon()}
        <div>
          <div className="font-medium">{speakerName}: "{claimText.length > 50 ? claimText.substring(0, 50) + '...' : claimText}"</div>
          <div className="text-sm mt-1">
            <span className="font-semibold">Verdict: </span> 
            <span className={cn(
              verdict === 'true' ? "text-debate-true" : 
              verdict === 'false' ? "text-debate-false" : 
              "text-debate-unverified"
            )}>
              {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
            </span>
          </div>
          <div className="text-sm"><span className="font-semibold">Source: </span>{source}</div>
          <div className="text-sm mt-1">{explanation}</div>
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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Fact Check Results</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {factChecks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No fact checks yet. Make some claims!
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FactCheckResults;
