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
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Upload Audio/Video File</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload an MP3 or MP4 file for automatic speaker detection and fact-checking
          </p>
          
          {!uploadedFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">MP3, MP4, WAV, M4A files up to 50MB</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {uploadedFile.type.startsWith('audio/') ? (
                    <FileAudio className="h-8 w-8 text-purple-600" />
                  ) : (
                    <FileVideo className="h-8 w-8 text-purple-600" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-sm">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
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
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {audioUrl && (
                <div className="mb-4">
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
                  
                  <div className="flex items-center gap-3 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                      disabled={isProcessing}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">
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
                <div className="space-y-3">
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-sm text-gray-600">
                    Processing... {processingProgress}%
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={processFile}
                  className="w-full"
                  disabled={!uploadedFile}
                >
                  <Users className="h-4 w-4 mr-2" />
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
          <div className="border-t pt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Detected Speakers ({detectedSpeakers.length})
            </h4>
            <div className="space-y-3">
              {detectedSpeakers.map(speaker => (
                <div key={speaker.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-sm mb-2">{speaker.name}</div>
                  <div className="space-y-1">
                    {speaker.segments.map((segment, index) => (
                      <div key={index} className="text-xs">
                        <span className="text-gray-500">
                          {formatTime(segment.start)} - {formatTime(segment.end)}:
                        </span>
                        <span className="ml-1">{segment.text}</span>
                        <span className="ml-2 text-gray-400">
                          ({Math.round(segment.confidence * 100)}%)
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
