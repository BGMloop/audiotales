import { NextResponse } from 'next/server';
import { getStoryFromFS } from '@/lib/server/stories';
import { headers } from 'next/headers';

interface RouteContext {
  params: Promise<{
    title: string;
  }>;
}

// Cache for story data
const storyCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to safely decode title
function decodeTitle(title: string): string {
  try {
    return decodeURIComponent(title);
  } catch (error) {
    console.error('[Debug] Error decoding title:', error);
    return title; // Return original if decoding fails
  }
}

// Helper function to get cached story or fetch new data
async function getCachedStory(title: string): Promise<any> {
  const cached = storyCache.get(title);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`[Debug] Cache hit for story: ${title}`);
    return cached.data;
  }

  console.log(`[Debug] Cache miss for story: ${title}`);
  const start = performance.now();
  const story = getStoryFromFS(title);
  const fetchTime = performance.now() - start;
  console.log(`[Debug] Story fetch took ${fetchTime.toFixed(2)}ms`);

  if (story) {
    storyCache.set(title, { data: story, timestamp: now });
  }

  return story;
}

export async function GET(request: Request, context: RouteContext) {
  const requestStart = performance.now();
  
  try {
    // Log request details
    console.log('[Debug] Incoming request:', {
      url: request.url,
      method: request.method
    });

    // First, resolve and decode the title
    const resolvedParams = await context.params;
    const decodedTitle = decodeTitle(resolvedParams.title);
    console.log('[Debug] Resolved title:', decodedTitle);
    
    // Get the story (from cache or fetch new)
    const story = await getCachedStory(decodedTitle);
    
    if (!story) {
      console.warn(`[Debug] Story not found: ${decodedTitle}`);
      return NextResponse.json(
        { error: 'Story not found' },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const requestEnd = performance.now();
    console.log(`[Debug] Total request processing time: ${(requestEnd - requestStart).toFixed(2)}ms`);

    // Return successful response with caching headers
    return NextResponse.json(story, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    const requestEnd = performance.now();
    console.error('[Debug] Error in GET /api/stories/[title]:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      processingTime: `${(requestEnd - requestStart).toFixed(2)}ms`
    });

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 