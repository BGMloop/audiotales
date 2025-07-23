import { spawn } from 'child_process';
import path from 'path';

export interface AudioQualityResult {
  clarity: number;
  emotion: number;
  wer?: number;
}

export class AudioQualityAnalyzer {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(process.cwd(), 'lib/audioQuality.py');
  }

  async analyze_audio(audioPath: string, text?: string): Promise<AudioQualityResult> {
    return new Promise((resolve, reject) => {
      const args = [
        this.scriptPath,
        '--audio', audioPath,
      ];

      if (text) {
        args.push('--text', text);
      }

      const process = spawn(this.pythonPath, args);
      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse audio analysis result: ${error}`));
          }
        } else {
          reject(new Error(`Audio analysis failed: ${errorOutput}`));
        }
      });
    });
  }
} 