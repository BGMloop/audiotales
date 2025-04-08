import { NextResponse } from 'next/server';
import { generateSpeech, TTSOptions } from '@/lib/ttsService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voice, instructions, speed } = body;

    if (!text || !voice) {
      return NextResponse.json(
        { error: 'Text and voice are required' },
        { status: 400 }
      );
    }

    const options: TTSOptions = {
      voice,
      instructions,
      speed,
    };

    const audioBuffer = await generateSpeech(text, options);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in TTS API:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 