import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI TTS client if API key is available
let openai: OpenAI | null = null;
if (process.env.TEXT_TO_SPEECH_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.TEXT_TO_SPEECH_API_KEY,
  });
}

// Available voices in OpenAI's API
const AVAILABLE_VOICES = [
  // Standard voices
  'alloy', 'echo', 'fable', 'onyx', 'nova', 
  'shimmer', 'coral', 'sage', 'ash'
];

export async function POST(request: Request) {
  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      return NextResponse.json(
        { 
          error: 'Text-to-speech service is not configured',
          details: 'Missing API key. Please set TEXT_TO_SPEECH_API_KEY environment variable.'
        },
        { status: 503 }
      );
    }

    const { text, voice, speed } = await request.json();

    // Validate required parameters
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!voice) {
      return NextResponse.json(
        { error: 'Voice is required' },
        { status: 400 }
      );
    }

    // Validate voice
    if (!AVAILABLE_VOICES.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Available voices are: ${AVAILABLE_VOICES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate speed
    if (speed && (speed < 0.25 || speed > 4.0)) {
      return NextResponse.json(
        { error: 'Speed must be between 0.25 and 4.0' },
        { status: 400 }
      );
    }

    // Generate speech using OpenAI's TTS API
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: speed || 1.0,
    });

    // Convert the response to base64
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      audioData: base64Audio,
    });
  } catch (error) {
    console.error('Error in /api/speak:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Text-to-speech service is not properly configured',
            details: 'Invalid API key'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 