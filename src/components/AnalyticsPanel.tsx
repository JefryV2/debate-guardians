
import React from 'react';
import { useDebate } from '@/context/DebateContext';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AnalyticsPanel = () => {
  const { factChecks, transcript, speakers } = useDebate();
  
  // Calculate stats
  const totalClaims = factChecks.length;
  const verifiedClaims = factChecks.filter(fc => fc.verdict === 'true').length;
  const falseClaims = factChecks.filter(fc => fc.verdict === 'false').length;
  const unverifiedClaims = factChecks.filter(fc => fc.verdict === 'unverified').length;
  
  const verifiedPercentage = totalClaims ? Math.round((verifiedClaims / totalClaims) * 100) : 0;
  const falsePercentage = totalClaims ? Math.round((falseClaims / totalClaims) * 100) : 0;
  const unverifiedPercentage = totalClaims ? Math.round((unverifiedClaims / totalClaims) * 100) : 0;
  
  return (
    <div className="h-full">
      <h2 className="text-lg font-medium mb-4">Debate Analytics</h2>
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Claims by Speaker</CardTitle>
            <CardDescription>Distribution of claims made by each speaker</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center p-6">
            <PieChartIcon className="h-24 w-24 text-gray-300" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Claim Accuracy Trend</CardTitle>
            <CardDescription>How fact-check results changed over time</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center p-6">
            <TrendingUp className="h-24 w-24 text-gray-300" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
