import { Story } from "@/types/stories";
import { generateSpeech, TTSOptions, Voice } from "./ttsService";
import path from "path";
import fs from "fs/promises";

interface NarrationResult {
  success: boolean;
  quality?: {
    clarity: number;
    emotion: number;
  };
  error?: string;
  audioPath?: string;
}

interface TestNarrationParams {
  voiceSample: string;
  text: string;
  outputPath: string;
}

export class NarrationService {
  async getAvailableVoices(): Promise<string[]> {
    // Return the list of available voices
    return [
      'alloy', 'echo', 'fable', 'onyx', 'nova', 
      'shimmer', 'coral', 'sage', 'ash'
    ];
  }

  async testNarration(params: TestNarrationParams): Promise<NarrationResult> {
    try {
      // Placeholder implementation
      const options: TTSOptions = {
        voice: params.voiceSample as Voice,
        instructions: "Read in a clear, engaging storytelling voice"
      };

      const audioBuffer = await generateSpeech(params.text, options);
      await fs.writeFile(params.outputPath, new Uint8Array(audioBuffer));

      return {
        success: true,
        audioPath: params.outputPath,
        quality: {
          clarity: 0.9,
          emotion: 0.85
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateStoryNarration(
    story: Story,
    voiceSample: string,
    storyPath: string
  ): Promise<NarrationResult[]> {
    try {
      return await Promise.all(story.pages.map(async (page, index) => {
        try {
          const pageNumber = index + 1;
          // Only announce page number for pages after the first one
          const textToNarrate = pageNumber === 1 
            ? page.txt 
            : `Page ${pageNumber}. ${page.txt}`;
          // Generate the audio file for the pages story narration
          const audioPath = path.join(storyPath, `page${pageNumber}.mp3`);
          const options: TTSOptions = {
            voice: voiceSample as Voice,
            instructions: "Read in a clear, engaging storytelling voice"
          };

          const audioBuffer = await generateSpeech(textToNarrate, options);
          await fs.writeFile(audioPath, new Uint8Array(audioBuffer));

          return {
            success: true,
            audioPath,
            quality: {
              clarity: 0.9,
              emotion: 0.85
            }
          };
        } catch (error) {
          console.error(`Error generating narration for page ${index + 1}:`, error);
          if (error instanceof Error && error.message.includes('quota')) {
            return {
              success: false,
              error: 'OpenAI API quota exceeded. Please check your billing details.',
              quality: {
                clarity: 0,
                emotion: 0
              }
            };
          }
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            quality: {
              clarity: 0,
              emotion: 0
            }
          };
        }
      }));
    } catch (error) {
      console.error('Error in story narration:', error);
      throw error;
    }
  }
} 