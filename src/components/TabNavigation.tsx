
import React from 'react';
import { Mic, Users, BarChart } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation = ({ activeTab, setActiveTab }: TabNavigationProps) => {
  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: <Mic className="h-4 w-4" /> },
    { id: 'speakers', label: 'Speakers', icon: <Users className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart className="h-4 w-4" /> },
  ];

  return (
    <div className="border-b bg-white">
      <div className="container mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id ? 
                "border-b-2 border-purple-600 text-purple-600" : 
                "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;
