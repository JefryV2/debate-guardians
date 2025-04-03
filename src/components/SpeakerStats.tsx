
import { useDebate, Speaker } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Lightbulb, FileText, BarChart, Brain, Book, AlertTriangle, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface SpeakerStatsProps {
  speaker: Speaker;
}

const SpeakerStats = ({ speaker }: SpeakerStatsProps) => {
  const [patternExpanded, setPatternExpanded] = useState(false);
  
  // Get speaker's topic expertise (excluding metadata keys)
  const topicExpertise = Object.entries(speaker.topicExpertise || {})
    .filter(([key]) => !key.includes('_'))
    .sort((a, b) => b[1] - a[1]);

  // Format claim history for chart
  const chartData = speaker.claimHistory?.map(entry => ({
    date: entry.date,
    accuracy: entry.accuracyScore
  })) || [];
  
  // Get argument patterns if available
  const patterns = speaker.argumentPatterns;
  
  // Calculate if we have enough data to show meaningful patterns
  const hasEnoughData = speaker.totalClaims >= 3;
  
  // Get top fallacies
  const topFallacies = patterns && Object.entries(patterns.fallacyFrequency || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Get bias color
  const getBiasColor = (bias?: string) => {
    switch(bias) {
      case 'factual': return 'text-green-600';
      case 'scientific': return 'text-blue-600';
      case 'emotional': return 'text-yellow-600';
      case 'political': return 'text-purple-600';
      case 'sensationalist': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };
  
  // Get bias icon
  const getBiasIcon = (bias?: string) => {
    switch(bias) {
      case 'factual': return <FileText className="h-3 w-3" />;
      case 'scientific': return <Book className="h-3 w-3" />;
      case 'emotional': return <Brain className="h-3 w-3" />;
      case 'political': return <AlertTriangle className="h-3 w-3" />;
      case 'sensationalist': return <BarChart className="h-3 w-3" />;
      default: return <Fingerprint className="h-3 w-3" />;
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          Speaker Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {/* Overall Accuracy */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-slate-700">Overall Accuracy</span>
            <span className={cn(
              "text-xs font-semibold",
              speaker.accuracyScore >= 80 ? "text-green-600" :
              speaker.accuracyScore >= 60 ? "text-amber-600" : "text-red-600"
            )}>
              {speaker.accuracyScore}%
            </span>
          </div>
          <Progress 
            value={speaker.accuracyScore} 
            className={cn(
              "h-1.5",
              speaker.accuracyScore >= 80 ? "bg-green-100" :
              speaker.accuracyScore >= 60 ? "bg-amber-100" : "bg-red-100" 
            )}
            indicatorClassName={cn(
              speaker.accuracyScore >= 80 ? "bg-green-500" :
              speaker.accuracyScore >= 60 ? "bg-amber-500" : "bg-red-500"
            )}
          />
          <div className="text-[10px] text-slate-500 mt-1">
            Based on {speaker.totalClaims} verified claims
          </div>
        </div>
        
        {/* Argument Pattern Analysis - NEW SECTION */}
        {patterns && (
          <Collapsible 
            open={patternExpanded} 
            onOpenChange={setPatternExpanded} 
            className="mb-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 mb-0.5">
                <Fingerprint className="h-3 w-3 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Argument Style</span>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronDown className={cn("h-3 w-3 transition-transform", patternExpanded && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </div>
            
            {/* Always visible pattern summary */}
            {patterns.overallBias && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-600">Argumentation style:</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] font-normal py-0 flex items-center gap-1",
                    getBiasColor(patterns.overallBias)
                  )}
                >
                  {getBiasIcon(patterns.overallBias)}
                  {patterns.overallBias.charAt(0).toUpperCase() + patterns.overallBias.slice(1)}
                </Badge>
              </div>
            )}
            
            <CollapsibleContent className="space-y-3 pt-2">
              {!hasEnoughData ? (
                <div className="text-[10px] text-slate-500 italic text-center py-1">
                  Need more claims to analyze argument patterns
                </div>
              ) : (
                <>
                  {/* Citation behavior */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">Cites studies/research:</span>
                      <Badge variant={patterns.citesStudies > 0 ? "default" : "outline"} className="text-[10px] py-0">
                        {((patterns.citesStudies / Math.max(speaker.totalClaims, 1)) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    {patterns.usesDebunkedSources > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">References debunked sources:</span>
                        <Badge variant="destructive" className="text-[10px] py-0">
                          {patterns.usesDebunkedSources} time{patterns.usesDebunkedSources !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Fallacy patterns */}
                  {topFallacies && topFallacies.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-600">Common fallacies:</span>
                      <div className="flex flex-wrap gap-1">
                        {topFallacies.map(([fallacy, count]) => (
                          <Badge key={fallacy} variant="outline" className="text-[10px] py-0">
                            {fallacy}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Preferred topics */}
                  {patterns.preferredTopics && patterns.preferredTopics.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-600">Favorite topics:</span>
                      <div className="flex flex-wrap gap-1">
                        {patterns.preferredTopics.slice(0, 3).map(topic => (
                          <Badge key={topic} variant="secondary" className="text-[10px] py-0">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Emotional appeals */}
                  {patterns.emotionalAppealFrequency > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">Emotional appeals:</span>
                      <Badge 
                        variant={patterns.emotionalAppealFrequency / Math.max(speaker.totalClaims, 1) > 0.3 ? "destructive" : "outline"} 
                        className="text-[10px] py-0"
                      >
                        {((patterns.emotionalAppealFrequency / Math.max(speaker.totalClaims, 1)) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )}
                  
                  {/* Improvement trend */}
                  {patterns.improvementTrend !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">Accuracy trend:</span>
                      <Badge 
                        variant={patterns.improvementTrend ? "default" : "outline"} 
                        className={cn(
                          "text-[10px] py-0",
                          patterns.improvementTrend ? "bg-green-500" : ""
                        )}
                      >
                        {patterns.improvementTrend ? "Improving" : "Stable/Declining"}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Topic Expertise */}
        {topicExpertise.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1.5">
              <Lightbulb className="h-3 w-3 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Topic Expertise</span>
            </div>
            <div className="space-y-1.5">
              {topicExpertise.slice(0, 3).map(([topic, score]) => (
                <div key={topic} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-normal py-0">
                    {topic}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Progress
                      value={score} 
                      className="w-16 h-1 bg-gray-100"
                      indicatorClassName={cn(
                        score >= 80 ? "bg-green-500" :
                        score >= 60 ? "bg-amber-500" : "bg-red-500"
                      )}
                    />
                    <span className="text-[10px] font-medium">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Historical Accuracy */}
        {chartData.length > 1 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Calendar className="h-3 w-3 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Accuracy Trend</span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="date" tick={{fontSize: 8}} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 8}} />
                  <Tooltip
                    contentStyle={{fontSize: '10px', padding: '2px 4px'}}
                    labelStyle={{fontWeight: 'bold', fontSize: '10px'}}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3b82f6"
                    dot={{r: 2}}
                    strokeWidth={2}
                    name="Accuracy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpeakerStats;

// Import missing components
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
