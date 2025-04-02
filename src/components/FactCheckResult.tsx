
import { useDebate, FactCheck } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Gauge, BookOpen, LightbulbOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FactCheckItemProps {
  factCheck: FactCheck;
  claimText: string;
  speakerName: string;
  topic?: string;
  fallacies?: string[];
  knowledgeGapIdentified?: boolean;
}

const FactCheckItem = ({ 
  factCheck, 
  claimText, 
  speakerName, 
  topic, 
  fallacies,
  knowledgeGapIdentified
}: FactCheckItemProps) => {
  const { verdict, source, explanation, confidenceScore } = factCheck;
  
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

  const getConfidenceColor = () => {
    if (!confidenceScore) return "bg-gray-200";
    
    if (confidenceScore >= 90) return "bg-green-500";
    if (confidenceScore >= 70) return "bg-blue-500";
    if (confidenceScore >= 50) return "bg-yellow-500";
    return "bg-red-500";
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
          
          <div className="text-sm mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold">Speaker:</span> 
            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">{speakerName}</span>
            
            {topic && (
              <Badge variant="outline" className="ml-auto">
                {topic}
              </Badge>
            )}
          </div>
          
          {/* Fallacies display */}
          {fallacies && fallacies.length > 0 && (
            <div className="mt-2 text-sm">
              <div className="flex items-center gap-1 text-orange-600 font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>Logical Fallacies:</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {fallacies.map((fallacy, index) => (
                  <Badge key={index} variant="secondary" className="bg-orange-50 text-orange-700 border border-orange-200">
                    {fallacy}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Knowledge gap indicator */}
          {knowledgeGapIdentified && (
            <div className="mt-2 text-sm flex items-center gap-1 text-purple-600">
              <LightbulbOff className="h-4 w-4" />
              <span className="font-medium">Knowledge gap identified</span>
            </div>
          )}
          
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
            
            {/* Confidence score */}
            {confidenceScore !== undefined && (
              <div className="ml-auto flex items-center gap-1">
                <Gauge className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-500">Confidence:</span>
                <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full", getConfidenceColor())}
                    style={{ width: `${confidenceScore}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold">{confidenceScore}%</span>
              </div>
            )}
          </div>
          
          <div className="text-sm mt-2"><span className="font-semibold">Source: </span>{source}</div>
          <div className="text-sm mt-2 bg-white/80 p-2 rounded">{explanation}</div>
          
          {/* Alternative perspectives */}
          {factCheck.alternativePerspectives && factCheck.alternativePerspectives.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="flex items-center gap-1 text-slate-600 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                <span>Alternative Perspective:</span>
              </div>
              <div className="mt-1 text-sm bg-slate-50 p-2 rounded italic">
                {factCheck.alternativePerspectives[0]}
              </div>
            </div>
          )}
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
  
  // Get topic for a claim
  const getClaimTopic = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    return claim?.topic;
  };
  
  // Get fallacies for a claim
  const getClaimFallacies = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    return claim?.fallacies;
  };
  
  // Get knowledge gap status for a claim
  const getClaimKnowledgeGapStatus = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    return claim?.knowledgeGapIdentified;
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
                  topic={getClaimTopic(factCheck.claimId)}
                  fallacies={getClaimFallacies(factCheck.claimId)}
                  knowledgeGapIdentified={getClaimKnowledgeGapStatus(factCheck.claimId)}
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
