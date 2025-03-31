import express, { Request, Response } from 'express';
import cors from 'cors';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = 3026;
const CONFIG_PATH = path.join(process.cwd(), 'config/voice-config.json');
const CACHE_DIR = path.join(process.cwd(), 'cache');
const CUSTOM_VOICES_DIR = path.join(process.cwd(), 'custom-voices/samples');

console.log('Custom voices directory:', CUSTOM_VOICES_DIR);

// Voice configuration type
interface VoiceConfig {
  preferredVoice: string;
  lastUsed: string;
}

// Base voice interface
interface Voice {
  name: string;
  displayName: string;
  language: string;
  provider: string;
  description?: string;
}

// Initialize configuration
let voiceConfig: VoiceConfig = {
  preferredVoice: 'Microsoft David Desktop',
  lastUsed: new Date().toISOString()
};

// Add more verbose logging
console.log('Starting Text-to-Speech server...');
console.log('Initializing Express app...');

app.use(cors());
app.use(express.json());
app.use('/visualizer', express.static(path.join(__dirname, '../public')));

console.log('Middleware configured...');

// Initialize configuration and cache directories
async function initializeServer() {
  try {
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.mkdir(CUSTOM_VOICES_DIR, { recursive: true });
    
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
      voiceConfig = JSON.parse(configData);
    } catch (error) {
      // If config doesn't exist, create it with default values
      await saveConfig();
    }
  } catch (error) {
    console.error('Error initializing server:', error);
  }
}

// Save configuration
async function saveConfig() {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(voiceConfig, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Process text with SSML-like markers
function processMarkers(text: string): string {
  const processedText = text
    .replace(/<volume level=['"]([0-9.]+)['"]>/g, (_, volume) => 
      `<prosody volume="${Math.round((parseFloat(volume) - 1) * 100)}%">`)
    .replace(/<rate speed=['"]([0-9]+)['"]>/g, (_, rate) => 
      `<prosody rate="${Math.round(((parseInt(rate) - 175) / 175) * 100)}%">`)
    .replace(/<pitch level=['"]([+-]?[0-9]+)['"]>/g, (_, pitch) => 
      `<prosody pitch="${pitch}st">`)
    .replace(/<emphasis level=['"]([a-z]+)['"]>/g, (_, level) => 
      `<emphasis level="${level}">`);

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">
    ${processedText}
    </prosody></emphasis></prosody></prosody>
  </speak>`;
}

// Function to speak text using Windows Speech API
async function speakText(text: string, voice: string, rate: number): Promise<void> {
  // Check if it's a custom voice
  if (voice.includes(":")) {
    const [provider, voiceName] = voice.split(":");
    if (provider === "Custom") {
      await playCustomVoice(voiceName);
      return;
    }
    // For Windows voices, we extract just the name
    voice = voiceName;
  }

  // Default Windows voice handling
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

// Play custom voice sample
async function playCustomVoice(voiceId: string): Promise<void> {
  try {
    console.log(`Attempting to play custom voice: ${voiceId}`);
    
    // Validate the custom voice directory exists
    try {
      await fs.access(CUSTOM_VOICES_DIR);
    } catch (error) {
      console.error(`Custom voices directory not found: ${CUSTOM_VOICES_DIR}`);
      throw new Error(`Custom voices directory not found. Please create: ${CUSTOM_VOICES_DIR}`);
    }
    
    // Find file matching the voiceId (which could be a normalized version of the filename)
    const files = await fs.readdir(CUSTOM_VOICES_DIR);
    
    // Special case for ashley_moore voice which is a favorite
    if (voiceId === 'ashley_moore' || voiceId === 'ashley') {
      const ashleyFile = files.find(file => 
        file.toLowerCase().includes('ashley') && 
        file.toLowerCase().endsWith('.mp3')
      );
      
      if (ashleyFile) {
        const filePath = path.join(CUSTOM_VOICES_DIR, ashleyFile);
        console.log(`🌟 Playing favorite Ashley Moore voice file: ${filePath}`);
        await playAudioFile(filePath);
        return;
      }
    }
    
    let matchingFile = '';
    
    // Try multiple matching strategies
    for (const file of files) {
      if (file.toLowerCase().endsWith('.mp3')) {
        // Strategy 1: Check for exact match
        if (file === `${voiceId}.mp3`) {
          matchingFile = file;
          console.log(`Found exact file match: ${file}`);
          break;
        }
        
        // Strategy 2: Check for case insensitive match
        if (file.toLowerCase() === `${voiceId.toLowerCase()}.mp3`) {
          matchingFile = file;
          console.log(`Found case-insensitive match: ${file}`);
          break;
        }
        
        // Strategy 3: Check for normalized version match
        const normalizedFilename = normalizeFilename(file.replace(/\.mp3$/i, ''));
        if (normalizedFilename === voiceId) {
          matchingFile = file;
          console.log(`Found normalized match: ${file} → ${normalizedFilename}`);
          break;
        }
        
        // Strategy 4: Check if voice ID is contained in the filename
        if (file.toLowerCase().includes(voiceId.toLowerCase())) {
          matchingFile = file;
          console.log(`Found partial match: ${file}`);
          break;
        }
      }
    }
    
    if (!matchingFile) {
      console.error(`Could not find voice sample for: ${voiceId}`);
      console.log(`Available voice files: ${files.filter(f => f.toLowerCase().endsWith('.mp3')).join(', ')}`);
      throw new Error(`Could not find voice sample for: ${voiceId}`);
    }
    
    const filePath = path.join(CUSTOM_VOICES_DIR, matchingFile);
    console.log(`Playing custom voice file: ${filePath}`);
    
    await playAudioFile(filePath);
  } catch (error) {
    console.error('Error playing custom voice:', error);
    throw error;
  }
}

// Helper function to play audio file with PowerShell
async function playAudioFile(filePath: string): Promise<void> {
  // Make sure the file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`Audio file not found: ${filePath}`);
  }
  
  // Play the MP3 file using PowerShell
  const powershellCommand = `
    Add-Type -AssemblyName PresentationCore;
    $mediaPlayer = New-Object System.Windows.Media.MediaPlayer;
    try {
      $mediaPlayer.Open([System.Uri]::new("${filePath.replace(/\\/g, '\\\\')}"));
      $mediaPlayer.MediaFailed += {
        Write-Error "Media failed to play: $($_.ErrorException.Message)";
        exit 1
      }
      $mediaPlayer.Play();
      Start-Sleep -Seconds 3;
    } finally {
      $mediaPlayer.Stop();
      $mediaPlayer.Close();
    }
  `;
  
  try {
    await promisify(exec)(`powershell -Command "${powershellCommand}"`);
  } catch (error: any) {
    console.error('Error playing audio file:', error);
    throw new Error(`Failed to play audio file: ${error.message}`);
  }
}

// Helper function to normalize filename to voice ID
function normalizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .trim();
}

// Get available voices
async function getVoices(): Promise<Voice[]> {
  try {
    // Get Windows voices
    let windowsVoices: Array<{ name: string; language: string }> = [];
    try {
      const command = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $voices = $synth.GetInstalledVoices() | ForEach-Object { 
          @{
            name = $_.VoiceInfo.Name;
            language = $_.VoiceInfo.Culture;
            provider = 'Windows'
          }
        };
        $synth.Dispose();
        ConvertTo-Json $voices -Compress
      `;
      
      const { stdout } = await promisify(exec)(`powershell -Command "${command}"`);
      const trimmedOutput = stdout.trim();
      
      // Handle empty or invalid JSON response
      if (trimmedOutput && trimmedOutput !== '[]' && trimmedOutput !== 'null') {
        try {
          const parsed = JSON.parse(trimmedOutput);
          windowsVoices = Array.isArray(parsed) ? parsed : [parsed];
        } catch (parseError) {
          console.error('Error parsing Windows voices JSON:', parseError);
          console.log('Raw output was:', trimmedOutput);
        }
      }
    } catch (windowsError) {
      console.error('Error getting Windows voices:', windowsError);
    }

    // Get custom voices from samples directory
    const customVoices: Voice[] = [];
    try {
      const files = await fs.readdir(CUSTOM_VOICES_DIR);
      console.log(`Found ${files.length} files in custom voices directory:`, CUSTOM_VOICES_DIR);
      
      for (const file of files) {
        if (file.toLowerCase().endsWith('.mp3')) {
          // Get the base name without extension
          const baseName = file.replace(/\.mp3$/i, '');
          
          // Create normalized ID by removing special characters and spaces
          const normalizedId = baseName
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
          
          // Create display name by cleaning up the base name
          const displayName = baseName
            .split(/[_\-]/)
            .map(part => part.trim())
            .filter(part => part && !part.match(/multilingual|male|female/i))
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          
          // Extract description from any text after a hyphen or underscore
          const descMatch = baseName.match(/[-_]\s*(.+?)(?=[-_]|$)/);
          const description = descMatch ? descMatch[1].trim() : '';
          
          customVoices.push({
            name: `Custom:${normalizedId}`,
            displayName,
            language: 'en-US', // Default to en-US, could be made dynamic
            provider: 'Custom',
            description
          });
          
          console.log(`Added custom voice: Custom:${normalizedId}`);
        }
      }
    } catch (error) {
      console.error('Error reading custom voices directory:', error);
    }

    // Combine Windows and custom voices
    const allVoices = [
      ...windowsVoices.map((voice: { name: string; language: string }) => ({
        name: `Windows:${voice.name}`,
        displayName: voice.name,
        language: voice.language,
        provider: 'Windows'
      })),
      ...customVoices
    ];
    
    console.log(`Total voices available: ${allVoices.length} (Windows: ${windowsVoices.length}, Custom: ${customVoices.length})`);
    return allVoices;
  } catch (error) {
    console.error('Error getting voices:', error);
    return [{
      name: 'Windows:Microsoft David Desktop',
      displayName: 'Microsoft David Desktop',
      language: 'en-US',
      provider: 'Windows'
    }];
  }
}

// Extract description from filename
function getDescriptionFromFilename(filename: string): string {
  // Look for patterns like "description" or "-description"
  const match = filename.match(/[-_]\s*([^_\-\.]+)$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
}

// Voice preview endpoint
app.post('/preview-voice', async (req: Request<any, any, { voice: string, text?: string, rate?: number }>, res: Response) => {
  try {
    console.log('Voice preview requested:', req.body);
    const { voice } = req.body;
    const text = req.body.text || "This is a preview of the selected voice.";
    const rate = req.body.rate || 175;
    
    if (!voice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Voice parameter is required' 
      });
    }
    
    // Define different preview texts based on voice type
    let previewText = text;
    
    // For celebrity voices, use voice-specific preview text
    if (voice.toLowerCase().includes('snoop')) {
      previewText = "Yo, what's up? This is a preview of my voice, you know what I'm sayin'?";
    } else if (voice.toLowerCase().includes('ashley')) {
      previewText = "In a world where voices matter, this is how I sound. Remember, every word can make a difference.";
    }
    
    console.log(`Previewing voice "${voice}" with text: "${previewText}"`);
    
    try {
      await speakText(previewText, voice, rate);
      res.json({ 
        success: true,
        message: 'Voice preview completed successfully',
        details: { voice, text: previewText, rate }
      });
    } catch (previewError: any) {
      console.error('Error during voice preview:', previewError);
      res.status(500).json({ 
        success: false, 
        error: 'Voice preview failed', 
        message: previewError.message 
      });
    }
  } catch (error: unknown) {
    console.error('Error in preview endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Voice preview failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Voice info endpoint - get details about a specific voice
app.get('/voice/:id', async (req: Request, res: Response) => {
  try {
    const voiceId = req.params.id;
    console.log(`Voice info requested for: ${voiceId}`);
    
    const allVoices = await getVoices();
    const voice = allVoices.find(v => v.name === voiceId);
    
    if (!voice) {
      return res.status(404).json({ 
        success: false, 
        error: 'Voice not found',
        availableVoices: allVoices.map(v => v.name)
      });
    }
    
    res.json({
      success: true,
      voice
    });
  } catch (error: unknown) {
    console.error('Error getting voice info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voice information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check requested');
  res.json({
    status: 'healthy',
    service: 'zonos-text-to-speech',
    timestamp: new Date().toISOString()
  });
});

// Get available voices endpoint
app.get('/voices', async (req: Request, res: Response) => {
  try {
    console.log('Voices list requested');
    const voices = await getVoices();
    console.log(`Available voices: ${voices.length}`);
    res.json(voices);
  } catch (error) {
    console.error('Error getting voices:', error);
    res.status(500).json({ error: 'Failed to get voices' });
  }
});

// Speak endpoint
app.post('/speak', async (req: Request, res: Response) => {
  console.log('Speech request received:', req.body);
  try {
    const {
      text,
      voice = voiceConfig.preferredVoice,
      rate = 175
    } = req.body;

    // Update preferred voice if different
    if (voice !== voiceConfig.preferredVoice) {
      voiceConfig.preferredVoice = voice;
      await saveConfig();
    }

    console.log('Processing text with markers...');
    const processedText = processMarkers(text);
    console.log('Processed text:', processedText);
    
    console.log('Initializing speech...');
    try {
      await speakText(processedText, voice, rate);
      console.log('Speech completed successfully');
      res.json({
        success: true,
        message: 'Text processed successfully',
        metadata: { text, voice, rate }
      });
    } catch (err) {
      console.error('Speech error:', err);
      res.status(500).json({
        success: false,
        message: 'Error processing speech request',
        error: String(err)
      });
    }
  } catch (error: unknown) {
    console.error('Error in speech request handler:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing speech request',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get voice configuration
app.get('/config', (req: Request, res: Response) => {
  res.json(voiceConfig);
});

// Update voice configuration
app.post('/config', async (req: Request, res: Response) => {
  try {
    const { preferredVoice } = req.body;
    if (preferredVoice) {
      voiceConfig.preferredVoice = preferredVoice;
      voiceConfig.lastUsed = new Date().toISOString();
      await saveConfig();
    }
    res.json(voiceConfig);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating configuration',
      error: String(error)
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Initialize server before starting
initializeServer().then(() => {
  app.listen(port, () => {
    console.log(`Text-to-Speech server running on port ${port}`);
  });
}); 