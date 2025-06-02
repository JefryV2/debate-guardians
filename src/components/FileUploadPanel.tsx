import React, { useState, useRef } from 'react';
import { Upload, FileAudio, FileVideo, X, Play, Pause, Users } from 'lucide-react';
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

    const validTypes = ['audio/mp3', 'audio/mpeg', 'video/mp4', 'audio/wav', 'audio/m4a'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload an MP3, MP4, WAV, or M4A file"
      });
      return;
    }

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
      toast.info("Processing audio", {
        description: "Extracting audio and detecting speakers..."
      });

      await simulateProgress(20, "Extracting audio...");
      await simulateProgress(50, "Detecting speakers...");
      await simulateProgress(80, "Transcribing speech...");
      await simulateProgress(100, "Finalizing...");

      const mockSpeakers = generateMockSpeakers();
      setDetectedSpeakers(mockSpeakers);

      mockSpeakers.forEach(speaker => {
        speaker.segments.forEach(segment => {
          addTranscriptEntry({
            text: segment.text,
            speakerId: speaker.id,
            timestamp: new Date(Date.now() + segment.start * 1000),
            isClaim: Math.random() > 0.7
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
    <Card className="p-8 bg-white border border-gray-200 rounded-xl">
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Upload Audio or Video File
          </h3>
          <p className="text-gray-600 mb-8">
            Upload a file for automatic speaker detection and transcription
          </p>
          
          {!uploadedFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2 font-medium">Choose a file or drag it here</p>
              <p className="text-sm text-gray-500">
                MP3, MP4, WAV, M4A up to 50MB
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    {uploadedFile.type.startsWith('audio/') ? (
                      <FileAudio className="h-8 w-8 text-blue-600" />
                    ) : (
                      <FileVideo className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-gray-500 hover:text-red-600"
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
                      className="rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-2">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                      <Progress 
                        value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isProcessing ? (
                <div className="space-y-4">
                  <Progress value={processingProgress} className="h-3" />
                  <p className="text-gray-600 font-medium">
                    Processing... {processingProgress}%
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={processFile}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg"
                  disabled={!uploadedFile}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Detect Speakers & Process
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
          <div className="border-t border-gray-200 pt-8">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Detected Speakers ({detectedSpeakers.length})
            </h4>
            <div className="space-y-4">
              {detectedSpeakers.map(speaker => (
                <div key={speaker.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-800 mb-3">{speaker.name}</div>
                  <div className="space-y-2">
                    {speaker.segments.map((segment, index) => (
                      <div key={index} className="text-sm bg-gray-50 rounded p-3">
                        <span className="text-blue-600 font-medium">
                          {formatTime(segment.start)} - {formatTime(segment.end)}:
                        </span>
                        <span className="ml-2 text-gray-700">{segment.text}</span>
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
