import librosa
import numpy as np
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import soundfile as sf
import argparse
import json
import sys

class AudioQualityAnalyzer:
    def __init__(self):
        # Initialize Wav2Vec2 for speech recognition (used for WER calculation)
        self.processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        self.model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
    
    def analyze_clarity(self, audio_path):
        """Analyze speech clarity using signal-to-noise ratio and spectral contrast."""
        try:
            # Load audio
            y, sr = librosa.load(audio_path)
            
            # Calculate signal-to-noise ratio
            signal_power = np.mean(y**2)
            noise = y - librosa.effects.preemphasis(y)
            noise_power = np.mean(noise**2)
            snr = 10 * np.log10(signal_power / noise_power) if noise_power > 0 else 100
            
            # Calculate spectral contrast
            contrast = np.mean(librosa.feature.spectral_contrast(y=y, sr=sr))
            
            # Normalize and combine metrics
            snr_norm = min(1.0, max(0.0, snr / 50))  # Normalize SNR to 0-1
            contrast_norm = min(1.0, max(0.0, contrast / 50))
            
            clarity = (snr_norm + contrast_norm) / 2
            return clarity
            
        except Exception as e:
            print(f"Error analyzing clarity: {str(e)}", file=sys.stderr)
            return 0.0
    
    def analyze_emotion(self, audio_path):
        """Analyze emotional expression using pitch variation and energy dynamics."""
        try:
            # Load audio
            y, sr = librosa.load(audio_path)
            
            # Calculate pitch using YIN algorithm
            f0 = librosa.yin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            # Remove zero values and calculate variation
            f0_cleaned = f0[f0 > 0]
            pitch_variation = np.std(f0_cleaned) if len(f0_cleaned) > 0 else 0
            
            # Calculate energy dynamics
            rmse = librosa.feature.rms(y=y)[0]
            energy_variation = np.std(rmse) / np.mean(rmse) if np.mean(rmse) > 0 else 0
            
            # Normalize and combine metrics
            pitch_norm = min(1.0, max(0.0, pitch_variation / 50))  # Adjusted normalization
            energy_norm = min(1.0, max(0.0, energy_variation * 2))
            
            emotion = (pitch_norm + energy_norm) / 2
            return emotion
            
        except Exception as e:
            print(f"Error analyzing emotion: {str(e)}", file=sys.stderr)
            return 0.0
    
    def calculate_wer(self, audio_path, reference_text):
        """Calculate Word Error Rate using Wav2Vec2."""
        try:
            # Load audio
            audio, sr = sf.read(audio_path)
            
            # Resample if necessary
            if sr != 16000:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
            
            # Process audio
            input_values = self.processor(audio, sampling_rate=16000, return_tensors="pt").input_values
            
            # Get model predictions
            with torch.no_grad():
                logits = self.model(input_values).logits
            
            # Decode predicted text
            predicted_ids = torch.argmax(logits, dim=-1)
            predicted_text = self.processor.batch_decode(predicted_ids)[0].lower()
            
            # Calculate WER
            ref_words = set(reference_text.lower().split())
            pred_words = set(predicted_text.split())
            
            errors = len(ref_words.symmetric_difference(pred_words))
            total_words = len(ref_words)
            
            wer = errors / total_words if total_words > 0 else 1.0
            return 1.0 - wer  # Return accuracy instead of error rate
            
        except Exception as e:
            print(f"Error calculating WER: {str(e)}", file=sys.stderr)
            return 0.0
    
    def analyze_audio(self, audio_path, reference_text=None):
        """Perform comprehensive audio quality analysis."""
        clarity = self.analyze_clarity(audio_path)
        emotion = self.analyze_emotion(audio_path)
        
        quality = {
            'clarity': clarity,
            'emotion': emotion
        }
        
        if reference_text:
            quality['wer'] = self.calculate_wer(audio_path, reference_text)
            
        return quality

def main():
    parser = argparse.ArgumentParser(description='Analyze audio quality')
    parser.add_argument('--audio', required=True, help='Path to audio file')
    parser.add_argument('--text', help='Reference text for WER calculation')
    args = parser.parse_args()

    analyzer = AudioQualityAnalyzer()
    result = analyzer.analyze_audio(args.audio, args.text)
    print(json.dumps(result))

if __name__ == '__main__':
    main() 