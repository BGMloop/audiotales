# Custom Voices for Zonos Text-to-Speech

This directory allows you to add your own custom voice samples to the text-to-speech system.

## Adding Custom Voices

1. Create an MP3 file with your voice sample
2. Name the file according to the voice ID (e.g., `ashley_moore.mp3`, `snoop_dogg.mp3`)
3. Place the MP3 file in the `samples` directory

## Supported Voice IDs

Currently supported voice IDs:
- `ashley moore` - Morgan Freeman voice sample
- `snoop_dogg` - Snoop Dogg voice sample
- `david_attenborough` - David Attenborough voice sample

## Adding New Voice IDs

To add support for a new voice:

1. Add the voice metadata to the `voiceMetadata` object in `src/providers/index.ts`
2. Create a corresponding MP3 file in the `samples` directory
3. Restart the server to load the new voice

## File Format Requirements

- Format: MP3
- Sample Rate: 44.1 kHz recommended
- Bit Rate: 128 kbps or higher recommended
- Duration: 5-10 seconds recommended
- Content: Clear speech sample in the voice's characteristic style

## Using Custom Voices

To use a custom voice in your application:

```powershell
$body = @{
    text = "Your text here"
    voice = "Custom:Ashley Moore"
    rate = 175
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3026/speak' -Method Post -Body $body -ContentType 'application/json'
```

## Mozilla TTS Integration

The system also includes Mozilla TTS integration for additional free voices. To use Mozilla TTS:

1. Install Mozilla TTS locally:
```bash
pip install tts
```

2. Start the Mozilla TTS server:
```bash
tts-server --model_name "tts_models/en/vctk/vits"
```

3. Use Mozilla voices in your requests:
```powershell
$body = @{
    text = "Your text here"
    voice = "Mozilla:Jenny"
    rate = 175
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3026/speak' -Method Post -Body $body -ContentType 'application/json'
``` 