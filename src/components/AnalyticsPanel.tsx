
import React from 'react';
import { useDebate } from '@/context/DebateContext';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Lightbulb,
  Brain
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const AnalyticsPanel = () => {
  const { factChecks, claims, speakers } = useDebate();
  
  // Calculate stats
  const totalClaims = factChecks.length;
  const verifiedClaims = factChecks.filter(fc => fc.verdict === 'true').length;
  const falseClaims = factChecks.filter(fc => fc.verdict === 'false').length;
  const unverifiedClaims = factChecks.filter(fc => fc.verdict === 'unverified').length;
  
  const verifiedPercentage = totalClaims ? Math.round((verifiedClaims / totalClaims) * 100) : 0;
  const falsePercentage = totalClaims ? Math.round((falseClaims / totalClaims) * 100) : 0;
  const unverifiedPercentage = totalClaims ? Math.round((unverifiedClaims / totalClaims) * 100) : 0;
  
  // Prepare data for speaker claims pie chart
  const pieChartData = speakers.map(speaker => {
    const speakerClaims = claims.filter(claim => claim.speakerId === speaker.id).length;
    return {
      name: speaker.name,
      value: speakerClaims,
      color: getColorForSpeaker(speaker.color)
    };
  }).filter(item => item.value > 0);
  
  // Prepare data for topic distribution bar chart
  const allTopics = claims
    .filter(claim => claim.topic)
    .map(claim => claim.topic as string);
  
  const topicCounts: Record<string, number> = {};
  allTopics.forEach(topic => {
    if (topic) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  });
  
  const topicData = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 topics
  
  // Prepare data for fallacy analysis
  const allFallacies: string[] = [];
  claims.forEach(claim => {
    if (claim.fallacies && claim.fallacies.length > 0) {
      allFallacies.push(...claim.fallacies);
    }
  });
  
  const fallacyCounts: Record<string, number> = {};
  allFallacies.forEach(fallacy => {
    fallacyCounts[fallacy] = (fallacyCounts[fallacy] || 0) + 1;
  });
  
  const fallacyData = Object.entries(fallacyCounts)
    .map(([fallacy, count]) => ({ fallacy, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 fallacies
  
  // Prepare time-based accuracy trend data
  const accuracyTrendMap: Record<string, { date: string, accuracyTrue: number, accuracyFalse: number, total: number }> = {};
  
  factChecks.forEach(check => {
    const claim = claims.find(c => c.id === check.claimId);
    if (claim && claim.timestamp) {
      const date = claim.timestamp.split('T')[0]; // Just get the date part
      
      if (!accuracyTrendMap[date]) {
        accuracyTrendMap[date] = { 
          date, 
          accuracyTrue: 0, 
          accuracyFalse: 0, 
          total: 0 
        };
      }
      
      accuracyTrendMap[date].total += 1;
      
      if (check.verdict === 'true') {
        accuracyTrendMap[date].accuracyTrue += 1;
      } else if (check.verdict === 'false') {
        accuracyTrendMap[date].accuracyFalse += 1;
      }
    }
  });
  
  const accuracyTrendData = Object.values(accuracyTrendMap)
    .map(item => ({
      ...item,
      truePercentage: Math.round((item.accuracyTrue / item.total) * 100),
      falsePercentage: Math.round((item.accuracyFalse / item.total) * 100)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Helper function to get color based on speaker's color property
  function getColorForSpeaker(colorClass: string) {
    switch(colorClass) {
      case 'debate-blue': return '#3b82f6';
      case 'debate-red': return '#ef4444';
      case 'debate-green': return '#10b981';
      case 'debate-orange': return '#f97316';
      case 'debate-purple': return '#8b5cf6';
      case 'debate-yellow': return '#eab308';
      case 'debate-cyan': return '#06b6d4';
      case 'debate-pink': return '#ec4899';
      default: return '#9ca3af';
    }
  }
  
  // Custom tooltip for the pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-2 border border-border shadow-md rounded-md text-xs">
          <p className="font-medium">{`${payload[0].name}`}</p>
          <p>{`Claims: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Debate Analytics</h2>
        <p className="text-muted-foreground">Comprehensive insights into debate performance and fact-checking results</p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-3 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-primary" />
              Total Claims
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-foreground">{totalClaims}</div>
              <div className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full font-semibold">
                100%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-3 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-500" />
              Verified Claims
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-green-600">{verifiedClaims}</div>
              <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                {verifiedPercentage}%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-3 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-red-500" />
              False Claims
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-red-600">{falseClaims}</div>
              <div className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                {falsePercentage}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Claims by Speaker - PIE CHART */}
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-4 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              Claims by Speaker
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Distribution of claims made by each speaker</CardDescription>
          </CardHeader>
          <CardContent className="p-3 h-80 flex justify-center items-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '14px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted rounded-xl p-6 border border-border">
                <PieChartIcon className="h-16 w-16 mb-3 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">No claims data available</p>
                <p className="text-sm text-muted-foreground">Start a debate to generate analytics</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Claim Accuracy Trend - LINE CHART */}
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-4 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <TrendingUp className="h-5 w-5 text-primary" />
              Claim Accuracy Trend
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">How fact-check results changed over time</CardDescription>
          </CardHeader>
          <CardContent className="p-3 h-80 flex justify-center items-center">
            {accuracyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={accuracyTrendData}
                  margin={{ top: 15, right: 30, left: 20, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend verticalAlign="top" height={40} />
                  <Line 
                    type="monotone" 
                    dataKey="truePercentage" 
                    name="True Claims" 
                    stroke="#10b981" 
                    activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} 
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4, stroke: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="falsePercentage" 
                    name="False Claims" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted rounded-xl p-6 border border-border">
                <TrendingUp className="h-16 w-16 mb-3 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">No trend data available</p>
                <p className="text-sm text-muted-foreground">Complete more fact checks to see trends</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Topic and Fallacy Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Topic Distribution - BAR CHART */}
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-4 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <BarChartIcon className="h-5 w-5 text-indigo-500" />
              Popular Debate Topics
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Most frequently discussed topics</CardDescription>
          </CardHeader>
          <CardContent className="p-3 h-80 flex justify-center items-center">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topicData}
                  layout="vertical"
                  margin={{ top: 15, right: 30, left: 100, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="topic" 
                    width={90}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(value) => [value, 'Claims']}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Claims" 
                    fill="#8b5cf6" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted rounded-xl p-6 border border-border">
                <BarChartIcon className="h-16 w-16 mb-3 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">No topic data available</p>
                <p className="text-sm text-muted-foreground">Topics will appear as claims are analyzed</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Fallacy Analysis - BAR CHART */}
        <Card className="rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
          <CardHeader className="pb-4 bg-muted rounded-t-xl border-b border-border">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <Brain className="h-5 w-5 text-rose-500" />
              Logical Fallacy Analysis
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Most common fallacies used in the debate</CardDescription>
          </CardHeader>
          <CardContent className="p-3 h-80 flex justify-center items-center">
            {fallacyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fallacyData}
                  layout="vertical"
                  margin={{ top: 15, right: 30, left: 120, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="fallacy" 
                    width={110}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(value) => [value, 'Occurrences']}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Occurrences" 
                    fill="#ef4444" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted rounded-xl p-6 border border-border">
                <Brain className="h-16 w-16 mb-3 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">No fallacy data available</p>
                <p className="text-sm text-muted-foreground">Fallacies will be detected as claims are analyzed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Need to add the Cell component for PieChart
import { Cell } from 'recharts';

export default AnalyticsPanel;
