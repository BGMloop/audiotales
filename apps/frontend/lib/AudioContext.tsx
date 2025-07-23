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
  preloadAudio: (base64Audio: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Separate the hook into a new file
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

// Rename to follow PascalCase convention and use named function
function AudioProviderComponent({ children }: { children: React.ReactNode }) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVoice, setCurrentVoice] = useState('nova');
  const router = useRouter();
  const pathname = usePathname();
  const audioCompleteCallback = useRef<(() => void) | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedContent = useRef<string | null>(null);
  const currentPageId = useRef<string | null>(null);
  const audioQueue = useRef<Array<{ audio: HTMLAudioElement; base64Audio: string }>>([]); 
  const loadingPromises = useRef<Map<string, Promise<HTMLAudioElement>>>(new Map());

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

      // Remove from queue if present
      audioQueue.current = audioQueue.current.filter(item => item.audio !== audio);
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

  const createAudioElement = useCallback(async (base64Audio: string): Promise<HTMLAudioElement> => {
    const audio = new Audio();
    audio.preload = 'auto';
    
    const loadPromise = new Promise<HTMLAudioElement>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve(audio); // Resolve anyway after 1 second
      }, 1000);

      audio.oncanplaythrough = () => {
        clearTimeout(timeoutId);
        resolve(audio);
      };

      audio.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load audio'));
      };
    });

    audio.src = `data:audio/mp3;base64,${base64Audio}`;
    audio.load();

    return loadPromise;
  }, []);

  const preloadAudio = useCallback(async (base64Audio: string) => {
    try {
      // Don't preload if we already have this audio in queue or it's loading
      if (audioQueue.current.some(item => item.base64Audio === base64Audio) ||
          loadingPromises.current.has(base64Audio)) {
        return;
      }

      // Create and start loading the audio element
      const loadPromise = createAudioElement(base64Audio);
      loadingPromises.current.set(base64Audio, loadPromise);

      const audio = await loadPromise;
      loadingPromises.current.delete(base64Audio);
      
      // Add to queue
      audioQueue.current.push({ audio, base64Audio });
      
      // Limit queue size
      if (audioQueue.current.length > 2) {
        const [removed] = audioQueue.current.splice(0, 1);
        await cleanupAudio(removed.audio);
      }
    } catch (error) {
      console.warn('Failed to preload audio:', error);
      loadingPromises.current.delete(base64Audio);
    }
  }, [cleanupAudio, createAudioElement]);

  const playAudio = useCallback(async (base64Audio: string, pageId: string) => {
    try {
      // If we're on a different page, stop current audio
      if (currentPageId.current !== pageId && currentAudioRef.current) {
        await cleanupAudio(currentAudioRef.current);
      }

      let audio: HTMLAudioElement;

      // Check if audio is already loading
      const loadingPromise = loadingPromises.current.get(base64Audio);
      if (loadingPromise) {
        audio = await Promise.race([
          loadingPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Loading timeout')), 1000))
        ]).catch(() => {
          // If loading times out, create a new audio element
          loadingPromises.current.delete(base64Audio);
          return createAudioElement(base64Audio);
        });
      } else {
        // Try to find the audio in our queue first
        const queuedAudio = audioQueue.current.find(item => item.base64Audio === base64Audio)?.audio;
        if (queuedAudio) {
          audio = queuedAudio;
        } else {
          // Create new audio element with fast loading
          audio = await createAudioElement(base64Audio);
        }
      }

      // Set up event handlers
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

      // Update references and state
      currentAudioRef.current = audio;
      lastPlayedContent.current = base64Audio;
      currentPageId.current = pageId;
      setAudioElement(audio);
      
      // Start playback immediately with a timeout
      const playPromise = audio.play();
      if (playPromise) {
        await Promise.race([
          playPromise,
          new Promise<void>((resolve) => setTimeout(resolve, 500))
        ]).catch(console.warn);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      if (currentAudioRef.current) {
        await cleanupAudio(currentAudioRef.current);
      }
      setAudioElement(null);
    }
  }, [cleanupAudio, createAudioElement]);

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
        preloadAudio
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// Export the provider separately
export const AudioProvider = AudioProviderComponent; 