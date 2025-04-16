"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AudioContextType {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  currentVoice: string;
  setCurrentVoice: (voice: string) => void;
  playAudio: (base64Audio: string, pageId: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  onAudioComplete: (callback: () => void) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVoice, setCurrentVoice] = useState('nova'); // Default voice
  const router = useRouter();
  const pathname = usePathname();
  const audioCompleteCallback = useRef<(() => void) | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedContent = useRef<string | null>(null);
  const currentPageId = useRef<string | null>(null);

  // Function to clean up the current audio element
  const cleanupAudio = useCallback(async (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    
    try {
      // Remove all event listeners first
      audio.onended = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onerror = null;
      
      // Stop playback
      if (!audio.paused) {
        await audio.pause();
      }
      
      // Reset and clear
      audio.currentTime = 0;
      audio.src = '';
      setIsPlaying(false);
      
      // Clear references
      if (audio === currentAudioRef.current) {
        currentAudioRef.current = null;
        lastPlayedContent.current = null;
        currentPageId.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  }, []);

  // Handle route changes
  useEffect(() => {
    const cleanup = async () => {
      if (currentAudioRef.current) {
        await cleanupAudio(currentAudioRef.current);
      }
    };

    // Clean up when pathname changes
    cleanup();
  }, [pathname, cleanupAudio]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        cleanupAudio(currentAudioRef.current);
      }
    };
  }, [cleanupAudio]);

  const playAudio = useCallback(async (base64Audio: string, pageId: string) => {
    try {
      // If we're on a different page, stop current audio
      if (currentPageId.current !== pageId && currentAudioRef.current) {
        await cleanupAudio(currentAudioRef.current);
      }

      // Create new audio element
      const audio = new Audio();
      
      // Set up event handlers before setting source
      audio.onended = () => {
        setIsPlaying(false);
        lastPlayedContent.current = null;
        currentPageId.current = null;
        if (audioCompleteCallback.current) {
          audioCompleteCallback.current();
        }
        cleanupAudio(audio);
      };

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        lastPlayedContent.current = null;
        currentPageId.current = null;
        cleanupAudio(audio);
      };

      // Set source and load
      audio.src = `data:audio/mp3;base64,${base64Audio}`;
      await audio.load();

      // Update references and state
      currentAudioRef.current = audio;
      lastPlayedContent.current = base64Audio;
      currentPageId.current = pageId;
      setAudioElement(audio);
      
      // Start playback
      await audio.play();
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to play audio:', error);
      }
      // Cleanup on error
      if (currentAudioRef.current) {
        await cleanupAudio(currentAudioRef.current);
      }
      setAudioElement(null);
    }
  }, [cleanupAudio]);

  const stopAudio = useCallback(async () => {
    try {
      if (currentAudioRef.current) {
        await cleanupAudio(currentAudioRef.current);
        setAudioElement(null);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, [cleanupAudio]);

  const pauseAudio = useCallback(async () => {
    try {
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        await currentAudioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }, []);

  const onAudioComplete = useCallback((callback: () => void) => {
    audioCompleteCallback.current = callback;
  }, []);

  return (
    <AudioContext.Provider
      value={{
        audioElement,
        isPlaying,
        currentVoice,
        setCurrentVoice,
        playAudio,
        pauseAudio,
        stopAudio,
        onAudioComplete,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 