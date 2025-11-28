import React, { useState } from 'react';
import { MessageSquare, BarChart3, Info, Settings, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation = ({ activeTab, setActiveTab }: TabNavigationProps) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <nav className={`flex flex-col bg-gradient-to-b from-background to-card border-r border-border transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} shadow-xl`}>
      {/* App Header */}
      <div className="p-2 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div>
                {/* h1 element removed as requested */}
              </div>
            </div>
          </div>
        )}
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-muted transition-all duration-200 group"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
          )}
        </button>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 py-4 space-y-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-300 ease-in-out ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary border-r-2 border-primary'
                  : 'text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className={`h-5 w-5 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-foreground'}`} />
              {!collapsed && (
                <span className="text-sm font-medium">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* App Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border mt-auto">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Debate Guardian v1.2</p>
            <p className="mt-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Real-time fact checking
            </p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TabNavigation;