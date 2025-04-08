import { NextResponse } from "next/server";
import { getAllStoriesFromFS, getStoryFromFS } from "@/lib/server/stories";

function logDebug(message: string, data?: any) {
  console.log(`[Debug] ${message}`, data || '');
}

function logError(message: string, error: any) {
  console.error(`[Error] ${message}:`, error);
}

export async function GET(request: Request) {
  const startTime = performance.now();
  logDebug('Handling GET request', request.url);

  try {
    const url = new URL(request.url);
    const storyTitle = url.searchParams.get("title");

    if (storyTitle) {
      logDebug('Fetching specific story:', storyTitle);
      const story = getStoryFromFS(storyTitle);
      
      if (!story) {
        logDebug('Story not found:', storyTitle);
        return NextResponse.json(
          { error: "Story not found" },
          { 
            status: 404,
            headers: {
              'Cache-Control': 'no-store'
            }
          }
        );
      }
      
      logDebug('Story found:', { title: story.story, pages: story.pages.length });
      return NextResponse.json(story, {
        headers: {
          'Cache-Control': 'no-store'
        }
      });
    }
    
    const stories = getAllStoriesFromFS();
    const endTime = performance.now();
    logDebug('Request completed', {
      processingTime: `${(endTime - startTime).toFixed(2)}ms`,
      storiesFound: stories.length
    });

    return NextResponse.json(stories, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    logError('Error handling GET request', error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 