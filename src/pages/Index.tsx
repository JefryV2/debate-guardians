
import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";
import ToleranceSlider from "@/components/ToleranceSlider";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/20">
      <DebateProvider>
        <div className="container py-4">
          <div className="w-full max-w-md mx-auto mb-4">
            <ToleranceSlider />
          </div>
          <DebateRoom />
        </div>
      </DebateProvider>
    </div>
  );
};

export default Index;
