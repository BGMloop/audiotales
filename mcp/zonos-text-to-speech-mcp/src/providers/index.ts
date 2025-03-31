import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';

// Base voice interface
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: string;
  category?: string;
  provider: string;
}

// Voice with additional metadata
export interface VoiceMetadata extends Voice {
  description?: string;
  sampleRate?: number;
  tags?: string[];
}

// Custom voice mapping to handle filename transformations
const CUSTOM_VOICE_MAPPING: Record<string, string> = {
  'ada_multilingual-_cheerful_warm_gentle_friendly': 'ada_multilingual',
  'alessioult_milingual_-male_cheerful_warm_gentle_friendly_cheerful': 'alessio_multilingual',
  'alloy_turbo_multilingual_-versatile': 'alloy_turbo_multilingual',
  'andrew_-male_confident_authentic': 'andrew_multilingual',
  'ana_-femalekid_curious_cheerful_engaging': 'ana_kid',
  'ava_-female_pleasant_cheerful_friendly': 'ava_multilingual',
  'brandon__-warm_engaging_authentic': 'brandon_multilingual',
  'brian_-male_sincere_calm_approachable': 'brian_multilingual',
  'cora_-_female_empathetic_formal_sincere': 'cora_multilingual',
  'davis_multilingual_-male_soothing_calm_smooth': 'davis_multilingual',
  'elizabeth__-female_authoritative_formal_serious': 'elizabeth',
  'emma__-female_cheerful_light_hearted_casual': 'emma_multilingual',
  'florian_multilingual__-male_cheerful_warm': 'florian_multilingual',
  'giuseppe_multilingual__-male_expressive_upbeat_youthful': 'giuseppe_multilingual',
  'hyunsu_multilingual': 'hyunsu_multilingual',
  'jane__-female_serious_approachable_upbeat': 'jane',
  'jenny__-female_sincere_pleasant_approachable': 'jenny',
  'luna__-female_sincere_pleasant_bright_clear_friendly_warm': 'luna',
  'michelle___-female_confident_sincere_warm': 'michelle',
  'monica___-female_mature_authentic_warm': 'monica',
  'nancy__-female_confident_sincere_mature': 'nancy',
  'nova_turbo_multilingual__-female_deep_resonant': 'nova_turbo_multilingual',
  'seraphina_multilingual__-female_casual_casual': 'seraphina_multilingual',
  'thalita_multilingual__-female_confident_formal_warm_cheerful_casual': 'thalita_multilingual',
  'tristan_multilingual_-male_formal_clear_trustworthy': 'tristan_multilingual',
  'vivienne_multilingual_-female_warm_casual': 'vivienne_multilingual',
  'xiaochen_multilingual__-female_friendly_casual_upbeat': 'xiaochen_multilingual',
  'xiaoxiao_multilingual__-female_warm_animated_bright': 'xiaoxiao_multilingual',
  'xiaoyu_multilingual__-deep_confident_casual': 'xiaoyu_multilingual',
  'ximena_multilingual__-female_formal_serious_upbeat': 'ximena_multilingual',
  'ashley_moore_-femalesincere_approachable_moore_honest': 'ashley',
  'snoop_dogg': 'snoop_dogg'
};

// Voice metadata for custom voices
export const voiceMetadata: Record<string, Omit<VoiceMetadata, 'id'>> = {
  'ada_multilingual': {
    name: 'Ada Multilingual',
    language: 'en-US',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Cheerful, Warm, Gentle, Friendly'
  },
  'alessio_multilingual': {
    name: 'Alessio Multilingual',
    language: 'en-US',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Cheerful, Warm, Gentle, Friendly'
  },
  'alloy_turbo_multilingual': {
    name: 'Alloy Turbo Multilingual',
    language: 'en-US',
    gender: 'Versatile',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Versatile, Adaptive'
  },
  'andrew_multilingual': {
    name: 'Andrew Multilingual',
    language: 'en-US',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Confident, Casual, Warm'
  },
  'ava_multilingual': {
    name: 'Ava Multilingual',
    language: 'en-US',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Pleasant, Friendly, Casual'
  },
  'brandon_multilingual': {
    name: 'Brandon Multilingual',
    language: 'en-US',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Warm, Engaging, Authentic'
  },
  'brian_multilingual': {
    name: 'Brian Multilingual',
    language: 'en-US',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Sincere, Calm, Approachable'
  },
  'cora_multilingual': {
    name: 'Cora Multilingual',
    language: 'en-US',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Empathetic, Formal, Sincere'
  },
  'davis_multilingual': {
    name: 'Davis Multilingual',
    language: 'en-US',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Soothing, Calm, Smooth'
  },
  'elizabeth': {
    name: 'Elizabeth',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Authoritative, Formal, Serious'
  },
  'emma_multilingual': {
    name: 'Emma Multilingual',
    language: 'en-US',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Cheerful, Light hearted, Casual'
  },
  'florian_multilingual': {
    name: 'Florian Multilingual',
    language: 'de-DE',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Cheerful, Warm'
  },
  'giuseppe_multilingual': {
    name: 'Giuseppe Multilingual',
    language: 'it-IT',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Expressive, Upbeat, Youthful'
  },
  'hyunsu_multilingual': {
    name: 'Hyunsu Multilingual',
    language: 'ko-KR',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Formal, Clear, Confident'
  },
  'jane': {
    name: 'Jane',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Serious, Approachable, Upbeat'
  },
  'jenny': {
    name: 'Jenny',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Sincere, Pleasant, Approachable'
  },
  'luna': {
    name: 'Luna',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Sincere, Pleasant, Bright, Clear, Friendly, Warm'
  },
  'michelle': {
    name: 'Michelle',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Confident, Sincere, Warm'
  },
  'monica': {
    name: 'Monica',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Mature, Authentic, Warm'
  },
  'nancy': {
    name: 'Nancy',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Confident, Sincere, Mature'
  },
  'nova_turbo_multilingual': {
    name: 'Nova Turbo Multilingual',
    language: 'en-US',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Deep, Resonant'
  },
  'seraphina_multilingual': {
    name: 'Seraphina Multilingual',
    language: 'en-US',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Casual, Approachable'
  },
  'thalita_multilingual': {
    name: 'Thalita Multilingual',
    language: 'pt-BR',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Confident, Formal, Warm, Cheerful, Casual'
  },
  'tristan_multilingual': {
    name: 'Tristan Multilingual',
    language: 'en-GB',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Formal, Clear, Trustworthy'
  },
  'vivienne_multilingual': {
    name: 'Vivienne Multilingual',
    language: 'fr-FR',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Warm, Casual'
  },
  'xiaochen_multilingual': {
    name: 'Xiaochen Multilingual',
    language: 'zh-CN',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Friendly, Casual, Upbeat'
  },
  'xiaoxiao_multilingual': {
    name: 'Xiaoxiao Multilingual',
    language: 'zh-CN',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Warm, Animated, Bright'
  },
  'xiaoyu_multilingual': {
    name: 'Xiaoyu Multilingual',
    language: 'zh-CN',
    gender: 'Male',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Deep, Confident, Casual'
  },
  'ximena_multilingual': {
    name: 'Ximena Multilingual',
    language: 'es-ES',
    gender: 'Female',
    category: 'Multilingual',
    provider: 'Custom',
    description: 'Formal, Serious, Upbeat'
  },
  'ana_kid': {
    name: 'Ana (Kid)',
    language: 'en-US',
    gender: 'Female',
    category: 'Child',
    provider: 'Custom',
    description: 'Curious, Cheerful, Engaging'
  },
  'ashley_moore': {
    name: 'Ashley Moore',
    language: 'en-US',
    gender: 'Female',
    category: 'Standard',
    provider: 'Custom',
    description: 'Sincere, Approachable, Honest'
  },
  'snoop_dogg': {
    name: 'Snoop Dogg',
    language: 'en-US',
    gender: 'Male',
    category: 'Celebrity',
    provider: 'Custom',
    description: 'Rapper, Distinctive, Laid-back'
  }
};

// Voice provider interface
export interface VoiceProvider {
  name: string;
  getVoices(): Promise<Voice[]>;
  speak(text: string, voiceName: string, rate: number): Promise<void>;
}

// Custom Voice Provider for MP3 samples
export class CustomVoiceProvider implements VoiceProvider {
  name = 'Custom';
  private samplesDir = path.join(__dirname, '../../custom-voices/samples');

  async getVoices(): Promise<Voice[]> {
    try {
      // Get list of MP3 files in samples directory
      const files = await fs.readdir(this.samplesDir);
      const voices: Voice[] = [];

      for (const file of files) {
        if (file.endsWith('.mp3')) {
          const voiceId = file.replace('.mp3', '');
          if (voiceMetadata[voiceId]) {
            voices.push({
              id: `Custom:${voiceId}`,
              ...voiceMetadata[voiceId]
            });
          }
        }
      }

      return voices;
    } catch (error) {
      console.error('Error getting custom voices:', error);
      return [];
    }
  }

  async speak(text: string, voiceName: string, rate: number): Promise<void> {
    // For custom voices, we'll use Windows Speech API as fallback
    const windowsProvider = new WindowsVoiceProvider();
    await windowsProvider.speak(text, 'Microsoft David Desktop', rate);
  }
}

// Mozilla TTS Provider
export class MozillaTTSProvider implements VoiceProvider {
  name = 'Mozilla';
  private voices = [
    {
      id: 'Mozilla:Jenny',
      name: 'Jenny',
      language: 'en-US',
      gender: 'Female',
      category: 'Natural',
      provider: 'Mozilla'
    },
    {
      id: 'Mozilla:John',
      name: 'John',
      language: 'en-US',
      gender: 'Male',
      category: 'Natural',
      provider: 'Mozilla'
    },
    {
      id: 'Mozilla:Amy',
      name: 'Amy',
      language: 'en-GB',
      gender: 'Female',
      category: 'Natural',
      provider: 'Mozilla'
    },
    {
      id: 'Mozilla:George',
      name: 'George',
      language: 'en-GB',
      gender: 'Male',
      category: 'Natural',
      provider: 'Mozilla'
    }
  ];

  async getVoices(): Promise<Voice[]> {
    return this.voices;
  }

  async speak(text: string, voiceName: string, rate: number): Promise<void> {
    try {
      // Use local instance of Mozilla TTS (needs to be installed separately)
      const command = `
        curl -X POST "http://localhost:5002/api/tts" \
        -H "Content-Type: application/json" \
        -d '{"text": "${text.replace(/"/g, '\\"')}", "speaker_id": "${voiceName}", "style_wav": "", "language_id": ""}'
      `;
      
      const { stdout } = await promisify(exec)(command);
      const audioData = Buffer.from(stdout, 'base64');
      
      // Save to temp file and play
      const tempFile = path.join(__dirname, '../../temp', `${Date.now()}.wav`);
      await fs.mkdir(path.dirname(tempFile), { recursive: true });
      await fs.writeFile(tempFile, audioData);
      
      // Play using Windows Media Player
      const playCommand = `(New-Object Media.SoundPlayer '${tempFile}').PlaySync()`;
      await promisify(exec)(`powershell -Command "${playCommand}"`);
      
      // Clean up
      await fs.unlink(tempFile);
    } catch (error) {
      console.error('Error with Mozilla TTS:', error);
      // Fallback to Windows TTS
      const windowsProvider = new WindowsVoiceProvider();
      await windowsProvider.speak(text, 'Microsoft David Desktop', rate);
    }
  }
}

// Windows voice provider
export class WindowsVoiceProvider implements VoiceProvider {
  name = 'Windows';
  
  async getVoices(): Promise<Voice[]> {
    try {
      const command = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $voices = $synth.GetInstalledVoices() | ForEach-Object { 
          @{
            id = "Windows:" + $_.VoiceInfo.Name;
            name = $_.VoiceInfo.Name;
            language = $_.VoiceInfo.Culture;
            provider = 'Windows'
          }
        };
        $synth.Dispose();
        ConvertTo-Json $voices
      `;
      
      const { stdout } = await promisify(exec)(`powershell -Command "${command}"`);
      const parsedVoices = JSON.parse(stdout.trim());
      return Array.isArray(parsedVoices) ? parsedVoices : [parsedVoices];
    } catch (error) {
      console.error('Error getting Windows voices:', error);
      return [{
        id: 'Windows:Microsoft David Desktop',
        name: 'Microsoft David Desktop',
        language: 'en-US',
        provider: 'Windows'
      }];
    }
  }

  async speak(text: string, voiceName: string, rate: number): Promise<void> {
    const command = `
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
      try {
        $synth.SelectVoice('${voiceName.replace(/'/g, "''")}');
        $synth.Rate = ${Math.min(10, Math.max(-10, (rate - 175) / 25))};
        $synth.Speak('${text.replace(/'/g, "''")}');
      } finally {
        $synth.Dispose();
      }
    `;
    
    await promisify(exec)(`powershell -Command "${command}"`);
  }
}

// Voice manager to handle providers
export class VoiceManager {
  private providers: VoiceProvider[] = [];
  private CUSTOM_VOICES_DIR: string;
  
  constructor() {
    this.providers.push(
      new WindowsVoiceProvider(),
      new CustomVoiceProvider(),
      new MozillaTTSProvider()
    );
    this.CUSTOM_VOICES_DIR = path.join(process.cwd(), 'custom-voices/samples');
    console.log(`Using custom voices directory: ${this.CUSTOM_VOICES_DIR}`);
  }

  async getAllVoices(): Promise<Voice[]> {
    const allVoices: Voice[] = [];
    for (const provider of this.providers) {
      try {
        const voices = await provider.getVoices();
        allVoices.push(...voices);
      } catch (error) {
        console.error(`Error getting voices from ${provider.name}:`, error);
      }
    }
    return allVoices;
  }

  async speak(text: string, voiceId: string, rate: number = 175): Promise<void> {
    console.log(`Speaking with voice: ${voiceId}, rate: ${rate}`);
    
    if (voiceId.startsWith('Windows:')) {
      // Extract the Windows voice name
      const windowsVoiceName = voiceId.replace('Windows:', '');
      await this.speakWithWindowsVoice(text, windowsVoiceName, rate);
    } else if (voiceId.startsWith('Custom:')) {
      // Extract the custom voice ID
      const customVoiceId = voiceId.replace('Custom:', '');
      await this.speakWithCustomVoice(text, customVoiceId, rate);
    } else {
      // Assume it's a direct voice name (backward compatibility)
      await this.speakWithWindowsVoice(text, voiceId, rate);
    }
  }
  
  private async speakWithWindowsVoice(text: string, voice: string, rate: number): Promise<void> {
    const powershellCommand = `
      Add-Type -AssemblyName System.Speech;
      $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer;
      try {
        $voices = $speak.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo };
        $selectedVoice = $voices | Where-Object { $_.Name -eq '${voice.replace(/'/g, "''")}' } | Select-Object -First 1;
        if ($selectedVoice) {
          $speak.SelectVoice($selectedVoice.Name);
          $speak.Rate = [Math]::Min([Math]::Max(${Math.floor((rate - 175) / 25)}, -10), 10);
          $speak.Speak("${text.replace(/"/g, '\\"')}");
        } else {
          throw "Voice '${voice}' not found. Available voices: " + ($voices | ForEach-Object { $_.Name } | Join-String -Separator ', ')
        }
      } finally {
        $speak.Dispose()
      }
    `;
    
    await promisify(exec)(`powershell -Command "${powershellCommand}"`);
  }
  
  private async speakWithCustomVoice(text: string, voiceId: string, rate: number): Promise<void> {
    // For custom voices, we simply play the MP3 file
    try {
      // Find the MP3 file that matches this voice ID
      const files = await fs.readdir(this.CUSTOM_VOICES_DIR);
      
      let matchingFile = '';
      
      // First try to find an exact match
      for (const file of files) {
        if (file.endsWith('.mp3')) {
          const filenameWithoutExt = file.replace('.mp3', '');
          const normalizedId = this.normalizeFilenameToVoiceId(filenameWithoutExt);
          
          if (normalizedId === voiceId) {
            matchingFile = file;
            break;
          }
        }
      }
      
      if (!matchingFile) {
        throw new Error(`Could not find MP3 file for voice ID: ${voiceId}`);
      }
      
      const filePath = path.join(this.CUSTOM_VOICES_DIR, matchingFile);
      console.log(`Playing custom voice file: ${filePath}`);
      
      // Play the MP3 file using PowerShell
      const powershellCommand = `
        Add-Type -AssemblyName PresentationCore;
        $mediaPlayer = New-Object System.Windows.Media.MediaPlayer;
        $mediaPlayer.Open([System.Uri]::new("${filePath.replace(/\\/g, '\\\\')}"));
        $mediaPlayer.Play();
        Start-Sleep -Seconds 3;
        $mediaPlayer.Stop();
        $mediaPlayer.Close();
      `;
      
      await promisify(exec)(`powershell -Command "${powershellCommand}"`);
    } catch (error) {
      console.error('Error playing custom voice:', error);
      throw error;
    }
  }

  private normalizeFilenameToVoiceId(filename: string): string {
    // First try exact match in mapping
    if (CUSTOM_VOICE_MAPPING[filename]) {
      return CUSTOM_VOICE_MAPPING[filename];
    }
    
    // Try case-insensitive match
    const lowerFilename = filename.toLowerCase();
    for (const [key, value] of Object.entries(CUSTOM_VOICE_MAPPING)) {
      if (key.toLowerCase() === lowerFilename) {
        return value;
      }
    }
    
    // If no match, clean up the filename to create a voice ID
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
} 