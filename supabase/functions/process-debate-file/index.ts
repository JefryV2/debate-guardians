
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileId } = await req.json();
    
    if (!fileId) {
      throw new Error('File ID is required');
    }

    console.log(`Processing debate file: ${fileId}`);

    // Get file info from database
    const { data: fileRecord, error: fileError } = await supabase
      .from('debate_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !fileRecord) {
      throw new Error('File not found in database');
    }

    // Update processing status
    await supabase
      .from('debate_files')
      .update({ processing_status: 'processing' })
      .eq('id', fileId);

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('debate-files')
      .download(fileRecord.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage');
    }

    console.log('File downloaded, starting transcription...');

    // Convert file to audio buffer for OpenAI
    const arrayBuffer = await fileData.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: fileRecord.mime_type });

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, fileRecord.filename);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    // Call OpenAI Whisper API
    const transcriptResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptResponse.ok) {
      throw new Error(`OpenAI API error: ${await transcriptResponse.text()}`);
    }

    const transcriptData = await transcriptResponse.json();
    console.log('Transcription completed, processing segments...');

    // Use Gemini for speaker detection and claim analysis
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this debate transcript and identify different speakers, then classify statements as claims or regular speech. Return a JSON response with this structure:
            {
              "speakers": [
                {"id": "speaker_1", "name": "Speaker 1"},
                {"id": "speaker_2", "name": "Speaker 2"}
              ],
              "segments": [
                {
                  "speaker_id": "speaker_1",
                  "start_time": 0.0,
                  "end_time": 5.2,
                  "text": "statement text",
                  "is_claim": true,
                  "confidence": 0.85
                }
              ]
            }
            
            Transcript: ${transcriptData.text}
            
            Instructions:
            - Identify distinct speakers based on context, speaking patterns, and topic changes
            - Mark statements as claims if they make factual assertions that can be verified
            - Provide confidence scores between 0.0 and 1.0
            - Split the transcript into logical segments based on speaker changes`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        }
      })
    });

    const geminiData = await geminiResponse.json();
    let analysisResult;
    
    try {
      const analysisText = geminiData.candidates[0].content.parts[0].text;
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Gemini response');
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      // Fallback to simple speaker detection
      analysisResult = {
        speakers: [
          { id: 'speaker_1', name: 'Speaker 1' },
          { id: 'speaker_2', name: 'Speaker 2' }
        ],
        segments: [{
          speaker_id: 'speaker_1',
          start_time: 0,
          end_time: transcriptData.duration || 60,
          text: transcriptData.text,
          is_claim: false,
          confidence: 0.7
        }]
      };
    }

    console.log('Analysis completed, saving to database...');

    // Save detected speakers
    const speakerInserts = analysisResult.speakers.map(speaker => ({
      debate_file_id: fileId,
      speaker_name: speaker.name,
      confidence_score: 0.85
    }));

    const { data: insertedSpeakers, error: speakerError } = await supabase
      .from('detected_speakers')
      .insert(speakerInserts)
      .select();

    if (speakerError) {
      throw new Error(`Failed to save speakers: ${speakerError.message}`);
    }

    // Create speaker ID mapping
    const speakerMap = new Map();
    analysisResult.speakers.forEach((speaker, index) => {
      if (insertedSpeakers[index]) {
        speakerMap.set(speaker.id, insertedSpeakers[index].id);
      }
    });

    // Save transcript segments
    const segmentInserts = analysisResult.segments.map(segment => ({
      debate_file_id: fileId,
      speaker_id: speakerMap.get(segment.speaker_id) || insertedSpeakers[0]?.id,
      start_time: segment.start_time,
      end_time: segment.end_time,
      text: segment.text,
      is_claim: segment.is_claim,
      confidence_score: segment.confidence
    }));

    const { error: segmentError } = await supabase
      .from('transcript_segments')
      .insert(segmentInserts);

    if (segmentError) {
      throw new Error(`Failed to save transcript segments: ${segmentError.message}`);
    }

    // Update file status and segment count
    await supabase
      .from('debate_files')
      .update({ 
        processing_status: 'completed',
        transcript_segments_count: segmentInserts.length
      })
      .eq('id', fileId);

    console.log(`Processing completed for file ${fileId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        speakers: insertedSpeakers.length,
        segments: segmentInserts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing debate file:', error);
    
    // Update status to failed
    if (req.json) {
      const { fileId } = await req.json();
      if (fileId) {
        await supabase
          .from('debate_files')
          .update({ processing_status: 'failed' })
          .eq('id', fileId);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
