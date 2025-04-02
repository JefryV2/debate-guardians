
import { useDebate, Speaker } from "@/context/DebateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeakerStatsProps {
  speaker: Speaker;
}

const SpeakerStats = ({ speaker }: SpeakerStatsProps) => {
  // Get speaker's topic expertise (excluding metadata keys)
  const topicExpertise = Object.entries(speaker.topicExpertise || {})
    .filter(([key]) => !key.includes('_'))
    .sort((a, b) => b[1] - a[1]);

  // Format claim history for chart
  const chartData = speaker.claimHistory?.map(entry => ({
    date: entry.date,
    accuracy: entry.accuracyScore
  })) || [];
  
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
