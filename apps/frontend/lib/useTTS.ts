import { useState } from 'react';
import { AVAILABLE_VOICES } from '@/lib/ttsService';

export function useTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSpeech = async (text: string, voice: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Clean up the URL when the audio is done playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      return audio;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate speech');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateSpeech,
    isLoading,
    error,
    availableVoices: AVAILABLE_VOICES,
  };
} 