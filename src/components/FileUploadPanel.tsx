import React, { useState, useRef } from 'react';
import { Upload, FileAudio, FileVideo, X, Play, Pause, Users, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDebate } from '@/context/DebateContext';
import { toast } from "@/lib/toast";

interface DetectedSpeaker {
  id: string;
  name: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

const FileUploadPanel = () => {
  const { addTranscriptEntry, addSpeaker, speakers } = useDebate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [detectedSpeakers, setDetectedSpeakers] = useState<DetectedSpeaker[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'video/mp4', 'audio/wav', 'audio/m4a'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload an MP3, MP4, WAV, or M4A file"
      });
      return;
    }

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 50MB"
      });
      return;
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    toast.success("File uploaded", {
      description: "Ready to process for speaker detection"
    });
  };

  const processFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing steps
      toast.info("Processing audio", {
        description: "Extracting audio and detecting speakers..."
      });

      // Step 1: Audio extraction (simulate)
      await simulateProgress(20, "Extracting audio...");
      
      // Step 2: Speaker diarization (simulate)
      await simulateProgress(50, "Detecting speakers...");
      
      // Step 3: Speech recognition (simulate)
      await simulateProgress(80, "Transcribing speech...");
      
      // Step 4: Final processing
      await simulateProgress(100, "Finalizing...");

      // Simulate detected speakers and transcript
      const mockSpeakers = generateMockSpeakers();
      setDetectedSpeakers(mockSpeakers);

      // Add transcript entries for each speaker segment
      mockSpeakers.forEach(speaker => {
        speaker.segments.forEach(segment => {
          addTranscriptEntry({
            text: segment.text,
            speakerId: speaker.id,
            timestamp: new Date(Date.now() + segment.start * 1000),
            isClaim: Math.random() > 0.7 // Random claim detection for demo
          });
        });
      });

      toast.success("Processing complete", {
        description: `Detected ${mockSpeakers.length} speakers and processed transcript`
      });

    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Processing failed", {
        description: "An error occurred while processing the file"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const simulateProgress = (targetProgress: number, message: string) => {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = Math.min(prev + 2, targetProgress);
          if (newProgress >= targetProgress) {
            clearInterval(interval);
            resolve();
          }
          return newProgress;
        });
      }, 100);
    });
  };

  const generateMockSpeakers = (): DetectedSpeaker[] => {
    return [
      {
        id: 'speaker-1',
        name: 'Speaker 1',
        segments: [
          {
            start: 0,
            end: 5,
            text: "According to recent studies, climate change affects global temperatures significantly.",
            confidence: 0.92
          },
          {
            start: 15,
            end: 22,
            text: "The research shows that renewable energy reduces carbon emissions by 60%.",
            confidence: 0.88
          }
        ]
      },
      {
        id: 'speaker-2',
        name: 'Speaker 2',
        segments: [
          {
            start: 6,
            end: 14,
            text: "I disagree with that assessment. The data doesn't support such broad claims.",
            confidence: 0.85
          },
          {
            start: 23,
            end: 30,
            text: "We need to consider the economic implications of these environmental policies.",
            confidence: 0.90
          }
        ]
      }
    ];
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setAudioUrl('');
    setDetectedSpeakers([]);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl rounded-2xl">
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Upload Audio/Video File
            </h3>
            <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
          </div>
          <p className="text-base text-gray-600 mb-6 font-medium">
            Upload an MP3 or MP4 file for automatic speaker detection and fact-checking! 🎉
          </p>
          
          {!uploadedFile ? (
            <div 
              className="border-3 border-dashed border-purple-300 rounded-2xl p-12 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 cursor-pointer transform hover:scale-105"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 text-purple-400 mx-auto mb-6" />
              <p className="text-lg text-gray-600 mb-3 font-semibold">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 bg-white rounded-full px-4 py-2 inline-block">
                MP3, MP4, WAV, M4A files up to 50MB ✨
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {uploadedFile.type.startsWith('audio/') ? (
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FileAudio className="h-10 w-10 text-purple-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-pink-100 rounded-full">
                      <FileVideo className="h-10 w-10 text-pink-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-bold text-lg">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-block">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {audioUrl && (
                <div className="mb-6">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onLoadedMetadata={() => {
                      if (audioRef.current) {
                        setDuration(audioRef.current.duration);
                      }
                    }}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setCurrentTime(audioRef.current.currentTime);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  
                  <div className="flex items-center gap-4 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                      disabled={isProcessing}
                      className="rounded-full border-2 border-purple-300 hover:bg-purple-50"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-2 font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                      <Progress 
                        value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                        className="h-3 rounded-full"
                        indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isProcessing ? (
                <div className="space-y-4">
                  <Progress 
                    value={processingProgress} 
                    className="h-4 rounded-full" 
                    indicatorClassName="bg-gradient-to-r from-green-400 to-blue-500"
                  />
                  <p className="text-lg text-gray-600 font-semibold">
                    Processing magic happening... {processingProgress}% ✨
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={processFile}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-full transform hover:scale-105 transition-all duration-200 shadow-lg"
                  disabled={!uploadedFile}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Detect Speakers & Process 🚀
                </Button>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.mp4,.wav,.m4a,audio/*,video/mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {detectedSpeakers.length > 0 && (
          <div className="border-t-2 border-purple-200 pt-8">
            <h4 className="font-bold text-xl mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              Detected Speakers ({detectedSpeakers.length}) 🎙️
            </h4>
            <div className="space-y-4">
              {detectedSpeakers.map(speaker => (
                <div key={speaker.id} className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-sm">
                  <div className="font-bold text-lg mb-3 text-purple-600">{speaker.name}</div>
                  <div className="space-y-2">
                    {speaker.segments.map((segment, index) => (
                      <div key={index} className="text-sm bg-purple-50 rounded-lg p-3">
                        <span className="text-purple-600 font-semibold">
                          {formatTime(segment.start)} - {formatTime(segment.end)}:
                        </span>
                        <span className="ml-2">{segment.text}</span>
                        <span className="ml-3 text-purple-400 font-medium">
                          ({Math.round(segment.confidence * 100)}% confidence)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FileUploadPanel;
