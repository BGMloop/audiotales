'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    workbox: any;
  }
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        if (
          typeof window !== 'undefined' &&
          'serviceWorker' in navigator &&
          window.workbox !== undefined
        ) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  return null;
} 