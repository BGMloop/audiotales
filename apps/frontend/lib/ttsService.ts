// Available voices in OpenAI's API
export const AVAILABLE_VOICES = [
    'alloy', 'echo', 'fable', 'onyx', 'nova', 
    'shimmer', 'coral', 'sage', 'ash'
  ] as const;
  
  export type Voice = typeof AVAILABLE_VOICES[number];

export interface TTSOptions {
  voice: Voice;
  instructions?: string;
  speed?: number;
}

export async function generateSpeech(text: string, options: TTSOptions): Promise<Buffer> {
  const { voice, instructions, speed = 1.0 } = options;
  
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed,
      ...(instructions && { voice_instructions: instructions }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API error: ${error.error || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
} 