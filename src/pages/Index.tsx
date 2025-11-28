import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";
import { SidebarProvider } from "@/components/ui/sidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light to-accent">
      <DebateProvider>
        <SidebarProvider>
          <DebateRoom />
        </SidebarProvider>
      </DebateProvider>
    </div>
  );
};

export default Index;