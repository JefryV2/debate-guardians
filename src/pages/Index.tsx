
import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/20">
      <DebateProvider>
        <DebateRoom />
      </DebateProvider>
    </div>
  );
};

export default Index;
