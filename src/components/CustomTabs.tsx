import React, { useState, createContext, useContext } from 'react';
import AnimatedButton from '@/components/AnimatedButton';

interface CustomTabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const CustomTabsContext = createContext<CustomTabsContextType | undefined>(undefined);

interface CustomTabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

const CustomTabs = ({ defaultValue, className = '', children }: CustomTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <CustomTabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`flex flex-col ${className}`}>
        {children}
      </div>
    </CustomTabsContext.Provider>
  );
};

interface CustomTabsListProps {
  className?: string;
  children: React.ReactNode;
}

const CustomTabsList = ({ className = '', children }: CustomTabsListProps) => {
  return (
    <div className={`flex justify-between items-center p-5 bg-card rounded-t-xl ${className}`}>
      <div className="flex space-x-4">
        {children}
      </div>
    </div>
  );
};

interface CustomTabTriggerProps {
  value: string;
  text: string;
  className?: string;
}

const CustomTabTrigger = ({ value, text, className = '' }: CustomTabTriggerProps) => {
  const context = useContext(CustomTabsContext);
  if (!context) {
    throw new Error('CustomTabTrigger must be used within CustomTabs');
  }
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;
  
  return (
    <div 
      className={`${className} ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      <AnimatedButton 
        text={text} 
        onClick={() => setActiveTab(value)}
        variant={isActive ? 'default' : 'outline'}
      />
    </div>
  );
};

interface CustomTabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const CustomTabsContent = ({ value, className = '', children }: CustomTabsContentProps) => {
  const context = useContext(CustomTabsContext);
  if (!context) {
    throw new Error('CustomTabsContent must be used within CustomTabs');
  }
  
  const { activeTab } = context;
  const isActive = activeTab === value;
  
  if (!isActive) return null;
  
  return (
    <div className={`flex-1 mt-0 ${className}`}>
      {children}
    </div>
  );
};

CustomTabs.List = CustomTabsList;
CustomTabs.Trigger = CustomTabTrigger;
CustomTabs.Content = CustomTabsContent;

export { CustomTabs };