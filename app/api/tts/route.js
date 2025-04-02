import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to get available voices
function getAvailableVoices() {
  const voicesDir = path.join(process.cwd(), 'mcp', 'zonos-text-to-speech-mcp', 'custom-voices', 'samples');
  try {
    const files = fs.readdirSync(voicesDir);
    return files
      .filter(file => file.toLowerCase().endsWith('.mp3'))
      .map(file => ({
        // Convert filename to safe ID by removing .mp3 and replacing spaces with underscores
        id: file.replace(/\.mp3$/i, '').replace(/\s+/g, '_').toLowerCase(),
        // Remove .mp3 for display name
        name: file.replace(/\.mp3$/i, ''),
        filePath: path.join(voicesDir, file)
      }));
  } catch (error) {
    console.error('Error reading voices directory:', error);
    return [];
  }
}

// Get available voices
const availableVoices = getAvailableVoices();

export async function GET(request) {
  // Return list of available voices
  return NextResponse.json({ voices: availableVoices.map(voice => ({ id: voice.id, name: voice.name })) });
}

export async function POST(request) {
  try {
    const { text, voice } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }
    
    if (!voice) {
      return NextResponse.json(
        { error: "Voice is required" },
        { status: 400 }
      );
    }
    
    // Find the voice in our available voices - normalize voice input
    const normalizedVoice = voice.toLowerCase().replace(/\s+/g, '_');
    const selectedVoice = availableVoices.find(v => v.id === normalizedVoice);
    
    if (!selectedVoice) {
      return NextResponse.json(
        { error: `Voice '${voice}' not found. Available voices: ${availableVoices.map(v => v.name).join(', ')}` },
        { status: 404 }
      );
    }
    
    // In a production environment, we would generate audio based on the text
    // For now, we'll return the sample file for the selected voice
    
    try {
      // Read the voice file
      const audioBuffer = fs.readFileSync(selectedVoice.filePath);
      
      // Use the native Response instead of NextResponse for better stream handling
      return new Response(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString()
        },
      });
    } catch (fileError) {
      console.error('Error reading voice file:', fileError);
      return NextResponse.json(
        { error: 'Error retrieving voice sample' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert text to speech" },
      { status: 500 }
    );
  }
} 