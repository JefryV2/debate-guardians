import React from 'react';
import { Info, Mic, Shield, BarChart3, Users, Zap, Brain, Volume2, TrendingUp, FileText } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="h-full bg-card rounded-xl border border-border p-6 overflow-y-auto shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-muted p-2 rounded-full">
            <Info className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">About Debate Guardian</h1>
        </div>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-foreground/90 font-medium mb-8">
            Debate Guardian is an innovative real-time fact-checking application designed to enhance the quality and accuracy of debates. 
            Using advanced AI technologies, it monitors spoken content, identifies claims, and provides instant verification to promote 
            informed discussions and combat misinformation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-muted p-5 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Real-Time Speech Recognition</h3>
              </div>
              <p className="text-foreground/80 font-medium text-sm">
                Advanced speech-to-text technology captures and transcribes spoken words in real-time, 
                allowing for immediate analysis and fact-checking during debates.
              </p>
            </div>
            
            <div className="bg-primary/10 p-5 rounded-xl border border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">AI-Powered Fact Checking</h3>
              </div>
              <p className="text-foreground/80 font-medium text-sm">
                Utilizes Gemini AI and comprehensive databases to verify claims instantly, 
                distinguishing between facts, opinions, and misinformation with high accuracy.
              </p>
            </div>
            
            <div className="bg-muted p-5 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Speaker Analytics</h3>
              </div>
              <p className="text-foreground/80 font-medium text-sm">
                Tracks speaker performance metrics including accuracy scores, claim frequency, 
                and argumentation patterns to provide insights into debating effectiveness.
              </p>
            </div>
            
            <div className="bg-secondary/10 p-5 rounded-xl border border-secondary/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold text-foreground">Logical Fallacy Detection</h3>
              </div>
              <p className="text-foreground/80 font-medium text-sm">
                Identifies common logical fallacies in real-time, helping participants recognize 
                flawed reasoning and maintain higher standards of logical discourse.
              </p>
            </div>
            
            <div className="bg-muted p-5 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Knowledge Gap Identification</h3>
              </div>
              <p className="text-foreground/80 font-medium text-sm">
                Recognizes when claims touch on areas with limited scientific consensus or emerging research,
                helping identify topics that require more nuanced discussion.
              </p>
            </div>
            
            <div className="bg-primary/10 p-5 rounded-xl border border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Emotion & Tone Analysis</h3>
              </div>
              <p className="text-foreground/80 font-medium text-sm">
                Analyzes speaker emotion and tone in real-time, detecting when discussions become heated
                or when speakers may be using emotional manipulation rather than logical arguments.
              </p>
            </div>
          </div>
          
          <div className="bg-muted p-6 rounded-xl border border-border mb-8">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-foreground" />
              Advanced Features
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Core Capabilities:</h4>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80 font-medium text-sm">
                  <li>Real-time claim detection and classification</li>
                  <li>Multi-speaker conversation tracking</li>
                  <li>Speaking rate monitoring and alerts</li>
                  <li>Automatic topic categorization</li>
                  <li>Confidence scoring for fact checks</li>
                  <li>Historical accuracy tracking</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">Customization Options:</h4>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80 font-medium text-sm">
                  <li>Adjustable fact-checking sensitivity</li>
                  <li>Continuous analysis mode</li>
                  <li>Detailed speaker statistics</li>
                  <li>Performance trend analysis</li>
                  <li>Argument pattern recognition</li>
                  <li>Topic expertise tracking</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-muted p-6 rounded-xl border border-border mb-8">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-foreground" />
              How to Use Debate Guardian
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Getting Started:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-foreground/80 font-medium text-sm">
                  <li>Click "Setup AI" in the header to add your Gemini API key</li>
                  <li>Select a speaker by clicking their card in the speakers panel</li>
                  <li>Click the "Start" button to begin speech recognition</li>
                  <li>Begin speaking naturally - the system will identify and fact-check claims</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Advanced Features:</h4>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80 font-medium text-sm">
                  <li>Adjust fact-checking sensitivity using the tolerance slider</li>
                  <li>Enable emotion detection to analyze speaker sentiment</li>
                  <li>Review detailed speaker statistics and performance metrics</li>
                  <li>Manually mark statements as claims for focused analysis</li>
                  <li>Track argumentation patterns and logical consistency</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-foreground mb-3">Why Debate Guardian?</h3>
            <p className="text-foreground/80 font-medium text-sm mb-4">
              In an era of information overload and widespread misinformation, quality debate and discussion are more important than ever. 
              Debate Guardian empowers individuals and organizations to conduct more informed, accurate, and productive debates by:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80 font-medium text-sm">
              <li>Promoting factual accuracy in discussions</li>
              <li>Reducing the spread of misinformation</li>
              <li>Improving critical thinking skills</li>
              <li>Providing objective analysis of arguments</li>
              <li>Enhancing educational and professional debate experiences</li>
              <li>Identifying knowledge gaps and areas for further research</li>
              <li>Encouraging respectful, evidence-based discourse</li>
            </ul>
          </div>
          
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-foreground mb-3">API Integrations</h3>
            <p className="text-foreground/80 font-medium text-sm mb-4">
              Debate Guardian leverages advanced AI technologies to provide accurate fact-checking:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80 font-medium text-sm">
              <li><strong>ClaimBuster:</strong> Advanced claim detection technology from the University of Texas at Arlington that identifies factual statements requiring verification</li>
              <li><strong>Gemini AI:</strong> Google's powerful language model for deep analysis and fact verification</li>
              <li><strong>Hybrid Mode:</strong> Combines multiple approaches for the most comprehensive fact-checking</li>
            </ul>
            <p className="text-foreground/80 font-medium text-sm mt-4">
              To enable these features, add your API keys in the Settings panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;