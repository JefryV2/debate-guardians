
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileAudio, FileVideo, X, Play, Pause, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDebate } from '@/context/DebateContext';
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";

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
      const fileExtension = uploadedFile.name.split('.').pop();
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

      toast.info("Processing with AI", {
        description: "Analyzing audio with speech recognition and speaker detection..."
      });

      // Call the processing edge function
      const { data: processResult, error: processError } = await supabase.functions
        .invoke('process-debate-file', {
          body: { fileId: fileRecord.id }
        });

      if (processError) throw processError;

      setProcessingProgress(100);

      toast.success("Processing complete!", {
        description: `Detected ${processResult.speakers} speakers and ${processResult.segments} segments`
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
        addSpeaker(speaker.speaker_name);
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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card className="p-8 bg-white border border-gray-200 rounded-xl">
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            AI Debate Analysis
          </h3>
          <p className="text-gray-600 mb-8">
            Upload audio/video files for automatic AI speaker detection, transcription, and fact-checking
          </p>
          
          {!uploadedFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2 font-medium">Choose a file or drag it here</p>
              <p className="text-sm text-gray-500">
                MP3, MP4, WAV, M4A, WebM up to 100MB
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
                  disabled={isProcessing}
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
                    {isUploading ? 'Uploading...' : 'Processing with AI...'} {processingProgress}%
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={uploadAndProcessFile}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg"
                  disabled={!uploadedFile}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Upload & Process with AI
                </Button>
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
          <div className="border-t border-gray-200 pt-8">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Processed Files ({processedFiles.length})
            </h4>
            <div className="space-y-4">
              {processedFiles.map(file => (
                <div key={file.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file.processing_status)}
                      <div>
                        <div className="font-semibold text-gray-800">{file.filename}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          Status: {file.processing_status} 
                          {file.processing_status === 'completed' && (
                            <span className="ml-2">
                              • {file.transcript_segments_count} segments 
                              • {file.detected_speakers?.length || 0} speakers
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {file.processing_status === 'completed' && (
                      <Button
                        onClick={() => loadProcessedDataIntoDebate(file.id)}
                        variant="outline"
                        size="sm"
                      >
                        Load into Debate
                      </Button>
                    )}
                  </div>
                  {file.processing_status === 'completed' && file.transcript_segments && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {file.transcript_segments.slice(0, 3).map(segment => (
                        <div key={segment.id} className="text-sm bg-gray-50 rounded p-3">
                          <span className="text-blue-600 font-medium">
                            {formatTime(segment.start_time)} - {formatTime(segment.end_time)}:
                          </span>
                          <span className="ml-2 text-gray-700">{segment.text}</span>
                          {segment.is_claim && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Claim
                            </span>
                          )}
                        </div>
                      ))}
                      {file.transcript_segments.length > 3 && (
                        <div className="text-sm text-gray-500 text-center">
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
