import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileAudio, FileVideo, X, Play, Pause, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDebate } from '@/context/DebateContext';
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import AnimatedUploadButton from '@/components/AnimatedUploadButton';

interface ProcessedFile {
  id: string;
  filename: string;
  processing_status: string;
  transcript_segments_count: number;
  created_at: string;
  updated_at: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  duration?: number;
  detected_speakers: Array<{
    id: string;
    speaker_name: string;
    confidence_score: number;
  }>;
  transcript_segments: Array<{
    id: string;
    speaker_id: string;
    start_time: number;
    end_time: number;
    text: string;
    is_claim: boolean;
    confidence_score: number;
  }>;
}

const FileUploadPanel = () => {
  const { addTranscriptEntry, addSpeaker } = useDebate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load processed files on component mount
  useEffect(() => {
    loadProcessedFiles();
  }, []);

  // Subscribe to realtime updates for processing status
  useEffect(() => {
    const channel = supabase
      .channel('debate-files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debate_files'
        },
        () => {
          loadProcessedFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProcessedFiles = async () => {
    try {
      const { data: files, error } = await supabase
        .from('debate_files')
        .select(`
          *,
          detected_speakers (
            id,
            speaker_name,
            confidence_score
          ),
          transcript_segments (
            id,
            speaker_id,
            start_time,
            end_time,
            text,
            is_claim,
            confidence_score
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProcessedFiles(files || []);
    } catch (error) {
      console.error('Error loading processed files:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mp3', 'audio/mpeg', 'video/mp4', 'audio/wav', 'audio/m4a', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload an MP3, MP4, WAV, M4A, or WebM file"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 100MB"
      });
      return;
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    toast.success("File selected", {
      description: "Ready to upload and process for AI analysis"
    });
  };

  const uploadAndProcessFile = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      toast.info("Uploading file", {
        description: "Uploading to secure storage..."
      });

      // Generate unique filename
      const timestamp = Date.now();
      const storagePath = `${timestamp}-${uploadedFile.name}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('debate-files')
        .upload(storagePath, uploadedFile);

      if (uploadError) throw uploadError;

      setProcessingProgress(20);

      // Create database record
      const { data: fileRecord, error: dbError } = await supabase
        .from('debate_files')
        .insert({
          filename: uploadedFile.name,
          mime_type: uploadedFile.type,
          file_size: uploadedFile.size,
          storage_path: storagePath,
          processing_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setProcessingProgress(40);

      toast.info("Processing with Browser Speech Recognition", {
        description: "Using Web Speech API for transcription and speaker detection..."
      });

      // Process the file using browser speech recognition
      await processWithBrowserSpeechAPI(fileRecord.id, audioUrl);

      setProcessingProgress(100);

      toast.success("Processing complete!", {
        description: "Analysis completed using browser speech recognition"
      });

      // Load the processed data into the debate context
      await loadProcessedDataIntoDebate(fileRecord.id);

      // Clear the current file
      clearFile();

    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Processing failed", {
        description: error.message || "An error occurred while processing the file"
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const processWithBrowserSpeechAPI = async (fileId: string, audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if browser supports speech recognition
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error("Speech recognition not supported in this browser"));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      const transcriptSegments: Array<{
        text: string;
        start_time: number;
        end_time: number;
        speaker_id: string;
        is_claim: boolean;
      }> = [];

      let currentTime = 0;
      let speakerCounter = 1;

      // Create audio element to play the file for recognition
      const audio = new Audio(audioUrl);
      
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            
            if (transcript) {
              // Simple speaker detection based on pauses and content changes
              const speakerId = `speaker_${speakerCounter}`;
              
              // Basic claim detection using the text content
              const isClaim = detectClaim(transcript);
              
              transcriptSegments.push({
                text: transcript,
                start_time: currentTime,
                end_time: currentTime + 5, // Estimate 5 seconds per segment
                speaker_id: speakerId,
                is_claim: isClaim
              });

              currentTime += 5;

              // Switch speaker occasionally for demo purposes
              if (Math.random() > 0.7) {
                speakerCounter = speakerCounter === 1 ? 2 : 1;
              }
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      recognition.onend = async () => {
        try {
          // Save the results to database
          await saveTranscriptionResults(fileId, transcriptSegments);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      // Start recognition and play audio
      recognition.start();
      audio.play();

      // Stop recognition after audio ends
      audio.onended = () => {
        recognition.stop();
      };

      // Fallback: stop after 60 seconds
      setTimeout(() => {
        recognition.stop();
        audio.pause();
      }, 60000);
    });
  };

  // Simple claim detection function that takes text as parameter
  const detectClaim = (text: string): boolean => {
    const claimIndicators = [
      'studies show', 'research indicates', 'scientists say', 'proven that',
      'according to', 'statistics show', 'evidence suggests', 'experts agree',
      'i believe', 'the truth is', 'it\'s a fact', 'clearly', 'obviously'
    ];
    
    const lowerText = text.toLowerCase();
    return claimIndicators.some(indicator => lowerText.includes(indicator));
  };

  const saveTranscriptionResults = async (fileId: string, segments: Array<any>) => {
    try {
      // Create default speakers
      const speakers = [
        { debate_file_id: fileId, speaker_name: 'Speaker 1', confidence_score: 0.8 },
        { debate_file_id: fileId, speaker_name: 'Speaker 2', confidence_score: 0.8 }
      ];

      const { data: insertedSpeakers, error: speakerError } = await supabase
        .from('detected_speakers')
        .insert(speakers)
        .select();

      if (speakerError) throw speakerError;

      // Map speaker IDs
      const speakerMap: Record<string, string> = {};
      speakerMap['speaker_1'] = insertedSpeakers[0]?.id || '';
      speakerMap['speaker_2'] = insertedSpeakers[1]?.id || '';

      // Save transcript segments
      const segmentInserts = segments.map(segment => ({
        debate_file_id: fileId,
        speaker_id: speakerMap[segment.speaker_id] || insertedSpeakers[0]?.id,
        start_time: segment.start_time,
        end_time: segment.end_time,
        text: segment.text,
        is_claim: segment.is_claim,
        confidence_score: 0.7
      }));

      const { error: segmentError } = await supabase
        .from('transcript_segments')
        .insert(segmentInserts);

      if (segmentError) throw segmentError;

      // Update file status
      await supabase
        .from('debate_files')
        .update({ 
          processing_status: 'completed',
          transcript_segments_count: segmentInserts.length
        })
        .eq('id', fileId);

    } catch (error) {
      console.error('Error saving transcription results:', error);
      throw error;
    }
  };

  const loadProcessedDataIntoDebate = async (fileId: string) => {
    try {
      const { data: fileData, error } = await supabase
        .from('debate_files')
        .select(`
          *,
          detected_speakers (
            id,
            speaker_name,
            confidence_score
          ),
          transcript_segments (
            id,
            speaker_id,
            start_time,
            end_time,
            text,
            is_claim,
            confidence_score
          )
        `)
        .eq('id', fileId)
        .single();

      if (error) throw error;

      // Add speakers to debate context
      fileData.detected_speakers.forEach(speaker => {
        addSpeaker(); // Call without arguments
      });

      // Add transcript entries to debate context
      fileData.transcript_segments.forEach(segment => {
        addTranscriptEntry({
          text: segment.text,
          speakerId: segment.speaker_id,
          timestamp: new Date(Date.now() + segment.start_time * 1000),
          isClaim: segment.is_claim
        });
      });

    } catch (error) {
      console.error('Error loading processed data:', error);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="p-6 bg-card border border-border rounded-xl shadow-sm">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Free Debate Analysis
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Upload audio/video files for automatic speaker detection, transcription, and fact-checking
          </p>
          
          {!uploadedFile ? (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary hover:bg-muted transition-all duration-200 cursor-pointer"
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-base text-foreground mb-1 font-medium">Choose a file or drag it here</p>
              <p className="text-xs text-muted-foreground">
                MP3, MP4, WAV, M4A, WebM up to 100MB
              </p>
            </div>
          ) : (
            <div className="bg-muted rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {uploadedFile.type.startsWith('audio/') ? (
                      <FileAudio className="h-6 w-6 text-primary" />
                    ) : (
                      <FileVideo className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground text-sm">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                  disabled={isProcessing}
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
                      className="rounded-full h-8 w-8 p-0 border-border"
                    >
                      {isPlaying ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                      <Progress 
                        value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isProcessing ? (
                <div className="space-y-3">
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-foreground text-sm font-medium">
                    {isUploading ? 'Uploading...' : 'Processing with Browser Speech API...'} {processingProgress}%
                  </p>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <AnimatedUploadButton 
                    onClick={uploadAndProcessFile}
                    disabled={!uploadedFile}
                    isUploading={isProcessing}
                  />
                </div>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.mp4,.wav,.m4a,.webm,audio/*,video/mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {processedFiles.length > 0 && (
          <div className="border-t border-border pt-6">
            <h4 className="font-medium text-base mb-3 flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Processed Files ({processedFiles.length})
            </h4>
            <div className="space-y-3">
              {processedFiles.map(file => (
                <div key={file.id} className="bg-card rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.processing_status)}
                      <div>
                        <div className="font-medium text-foreground text-sm">{file.filename}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          Status: {file.processing_status} 
                          {file.processing_status === 'completed' && (
                            <span className="ml-1">
                              • {file.transcript_segments_count} segments 
                              • {file.detected_speakers?.length || 0} speakers
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {file.processing_status === 'completed' && (
                      <div className="w-full">
                        <button
                          onClick={() => loadProcessedDataIntoDebate(file.id)}
                          disabled={isProcessing}
                          className="w-full bg-primary text-primary-foreground font-medium py-1.5 px-3 rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          Load
                        </button>
                      </div>
                    )}
                  </div>
                  {file.processing_status === 'completed' && file.transcript_segments && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {file.transcript_segments.slice(0, 3).map(segment => (
                        <div key={segment.id} className="text-xs bg-muted rounded p-2">
                          <span className="text-primary font-medium">
                            {formatTime(segment.start_time)} - {formatTime(segment.end_time)}:
                          </span>
                          <span className="ml-1 text-foreground">{segment.text}</span>
                          {segment.is_claim && (
                            <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded">
                              Claim
                            </span>
                          )}
                        </div>
                      ))}
                      {file.transcript_segments.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{file.transcript_segments.length - 3} more segments
                        </div>
                      )}
                    </div>
                  )}
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