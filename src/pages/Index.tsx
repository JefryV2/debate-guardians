
import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";
import { SidebarProvider } from "@/components/ui/sidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DebateProvider>
        <SidebarProvider>
          <div className="w-full">
            <DebateRoom />
          </div>
        </SidebarProvider>
      </DebateProvider>
    </div>
  );
};

export default Index;
