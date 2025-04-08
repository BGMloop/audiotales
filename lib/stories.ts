import { Story } from "@/types/stories";

// Determine base URL based on environment
const BASE_URL = typeof window === 'undefined'
  ? process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000' // Server-side
  : window.location.origin; // Client-side - use current origin

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle fetch with retries
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cache-Control': 'no-store',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Debug] Fetch attempt failed, retrying... (${retries} attempts left):`, error);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Function to fetch all stories
export async function getAllStories(): Promise<Story[]> {
  try {
    console.log('[Debug] Fetching stories from:', `${BASE_URL}/api/stories`);
    const response = await fetchWithRetry(`${BASE_URL}/api/stories`);
    const stories = await response.json();
    console.log('[Debug] Fetched stories:', stories.length);
    return stories;
  } catch (error) {
    console.error("[Debug] Error fetching all stories:", error);
    throw new Error(`Failed to fetch stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to fetch a single story by story name
export async function getStory(storyName: string): Promise<Story | null> {
  try {
    if (!storyName) {
      throw new Error('Story name is required');
    }

    const encodedName = encodeURIComponent(storyName);
    console.log('[Debug] Fetching story:', storyName);
    console.log('[Debug] URL:', `${BASE_URL}/api/stories/${encodedName}`);
    
    const response = await fetchWithRetry(`${BASE_URL}/api/stories/${encodedName}`);
    
    // Handle 404 gracefully
    if (response.status === 404) {
      console.log(`[Debug] Story not found: ${storyName}`);
      return null;
    }

    const story = await response.json();
    console.log('[Debug] Story fetched successfully:', story.story);
    return story;
  } catch (error) {
    console.error(`[Debug] Error fetching story "${storyName}":`, error);
    throw new Error(`Failed to fetch story: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}