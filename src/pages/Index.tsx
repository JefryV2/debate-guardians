
import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";
import ToleranceSlider from "@/components/ToleranceSlider";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Users, BarChart2, FileText, Shield, GitCompare } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-debate-dark text-white">
      <DebateProvider>
        <SidebarProvider>
          <div className="flex w-full">
            <Sidebar variant="inset" className="hidden md:flex">
              <SidebarHeader className="flex flex-col items-center justify-center p-6 border-b border-debate-darkHighlight">
                <h1 className="text-xl font-bold bg-gradient-to-r from-debate-spotify to-debate-twitch bg-clip-text text-transparent">
                  Debate Guardians
                </h1>
                <p className="text-xs text-gray-400 mt-1">AI-Powered Fact Checking</p>
              </SidebarHeader>
              
              <SidebarContent className="flex flex-col gap-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-debate-darkHighlight cursor-pointer transition-colors">
                    <Users className="w-5 h-5 text-debate-spotify" />
                    <span className="text-sm">Speakers</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-debate-darkHighlight cursor-pointer transition-colors">
                    <BarChart2 className="w-5 h-5 text-debate-twitch" />
                    <span className="text-sm">Analytics</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-debate-darkHighlight cursor-pointer transition-colors">
                    <FileText className="w-5 h-5 text-debate-spotify" />
                    <span className="text-sm">Transcripts</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-debate-darkHighlight cursor-pointer transition-colors">
                    <GitCompare className="w-5 h-5 text-debate-twitch" />
                    <span className="text-sm">Comparisons</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-debate-darkHighlight cursor-pointer transition-colors">
                    <Shield className="w-5 h-5 text-debate-spotify" />
                    <span className="text-sm">Fact Checks</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <ToleranceSlider />
                </div>
              </SidebarContent>
              
              <SidebarFooter className="p-4 border-t border-debate-darkHighlight mt-auto">
                <p className="text-xs text-gray-400 text-center">
                  Debate Guardians v2.0
                </p>
              </SidebarFooter>
            </Sidebar>
            
            <div className="flex-1 max-h-screen overflow-auto">
              <DebateRoom />
            </div>
          </div>
        </SidebarProvider>
      </DebateProvider>
    </div>
  );
};

export default Index;
