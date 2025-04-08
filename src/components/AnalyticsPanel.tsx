
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
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md text-xs">
          <p className="font-medium">{`${payload[0].name}`}</p>
          <p>{`Claims: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-medium mb-4">Debate Analytics</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{totalClaims}</div>
              <BarChartIcon className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Verified Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-green-600">{verifiedClaims}</div>
              <div className="text-sm text-gray-500">{verifiedPercentage}%</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">False Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-red-600">{falseClaims}</div>
              <div className="text-sm text-gray-500">{falsePercentage}%</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Claims by Speaker - PIE CHART */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Claims by Speaker</CardTitle>
            <CardDescription>Distribution of claims made by each speaker</CardDescription>
          </CardHeader>
          <CardContent className="p-2 h-72 flex justify-center items-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <PieChartIcon className="h-16 w-16 mb-2" />
                <p className="text-sm">No claims data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Claim Accuracy Trend - LINE CHART */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Claim Accuracy Trend</CardTitle>
            <CardDescription>How fact-check results changed over time</CardDescription>
          </CardHeader>
          <CardContent className="p-2 h-72 flex justify-center items-center">
            {accuracyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={accuracyTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                  <Legend verticalAlign="top" />
                  <Line 
                    type="monotone" 
                    dataKey="truePercentage" 
                    name="True Claims" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="falsePercentage" 
                    name="False Claims" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <TrendingUp className="h-16 w-16 mb-2" />
                <p className="text-sm">No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Topic and Fallacy Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Topic Distribution - BAR CHART */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Popular Debate Topics</CardTitle>
            <CardDescription>Most frequently discussed topics</CardDescription>
          </CardHeader>
          <CardContent className="p-2 h-72 flex justify-center items-center">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topicData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="topic" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Claims" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BarChartIcon className="h-16 w-16 mb-2" />
                <p className="text-sm">No topic data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Fallacy Analysis - BAR CHART */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Logical Fallacy Analysis</CardTitle>
            <CardDescription>Most common fallacies used in the debate</CardDescription>
          </CardHeader>
          <CardContent className="p-2 h-72 flex justify-center items-center">
            {fallacyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fallacyData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="fallacy" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" name="Occurrences" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Brain className="h-16 w-16 mb-2" />
                <p className="text-sm">No fallacy data available</p>
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
