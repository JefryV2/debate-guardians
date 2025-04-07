
import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";
import ToleranceSlider from "@/components/ToleranceSlider";
import CounterArgumentDisplay from "@/components/CounterArgumentDisplay";

const Index = () => {
  return (
    <div className="min-h-screen bg-debate-dark text-white">
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
