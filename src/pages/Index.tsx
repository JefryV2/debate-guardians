
import { DebateProvider } from "@/context/DebateContext";
import DebateRoom from "@/components/DebateRoom";

const Index = () => {
  return (
    <DebateProvider>
      <DebateRoom />
    </DebateProvider>
  );
};

export default Index;
