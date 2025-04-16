import { NextRequest, NextResponse } from "next/server";
import { NarrationService } from "@/lib/narrationService";
import path from "path";
import fs from "fs";
import { Story } from "@/types/stories";

interface NarrationResult {
  success: boolean;
  quality?: {
    clarity: number;
    emotion: number;
  };
}

const storiesDirectory = path.join(process.cwd(), "public/stories");

function logError(context: string, error: any, additionalInfo: any = {}) {
  console.error(`Error in ${context}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalInfo
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  const startTime = Date.now();
  let resolvedParams: { title: string } = { title: '' };
  
  try {
    // Resolve params if it's a Promise
    resolvedParams = await params;
    const title = resolvedParams.title;
    console.log('Starting narration generation for:', title);
    
    const body = await request.json();
    const { voiceSample } = body;

    if (!voiceSample) {
      return NextResponse.json(
        { error: "Voice sample is required" },
        { status: 400 }
      );
    }

    // Initialize narration service
    const narrationService = new NarrationService();
    console.log('Initialized narration service');

    // Get available voices
    const voices = await narrationService.getAvailableVoices();
    console.log('Available voices:', voices);
    
    if (!voices.includes(voiceSample)) {
      return NextResponse.json(
        { error: "Invalid voice sample" },
        { status: 400 }
      );
    }

    // Get the story data
    const decodedTitle = decodeURIComponent(title);
    const storyPath = path.join(storiesDirectory, decodedTitle);
    console.log('Story path:', storyPath);
    
    if (!fs.existsSync(storyPath)) {
      logError('Story path check', 'Story not found', { storyPath });
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Read the story data
    const storyFile = path.join(storyPath, 'story.json');
    console.log('Story file:', storyFile);
    
    if (!fs.existsSync(storyFile)) {
      logError('Story file check', 'Story data not found', { storyFile });
      return NextResponse.json(
        { error: "Story data not found" },
        { status: 404 }
      );
    }

    let story: Story;
    try {
      const storyData = fs.readFileSync(storyFile, 'utf-8');
      story = JSON.parse(storyData);
      console.log('Successfully loaded story data with', story.pages.length, 'pages');
    } catch (error) {
      logError('Story data parsing', error, { storyFile });
      return NextResponse.json(
        { error: "Failed to parse story data", details: error instanceof Error ? error.message : 'Invalid JSON' },
        { status: 500 }
      );
    }

    // Generate narration for the story
    const results = await narrationService.generateStoryNarration(
      story,
      voiceSample,
      storyPath
    );

    const success = results.every((r: NarrationResult) => r.success);
    const endTime = Date.now();
    console.log(`Narration generation completed in ${endTime - startTime}ms`);

    // Update metadata with narration info
    const metadataPath = path.join(storyPath, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        metadata.narration = {
          voice: voiceSample,
          isCustomVoice: true,
          quality: {
            clarity: results.reduce((acc: number, r: NarrationResult) => acc + (r.quality?.clarity || 0), 0) / results.length,
            emotion: results.reduce((acc: number, r: NarrationResult) => acc + (r.quality?.emotion || 0), 0) / results.length,
          }
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log('Updated metadata with narration info');
      } catch (error) {
        logError('Metadata update', error, { metadataPath });
        // Don't fail the request if metadata update fails
        console.warn('Failed to update metadata, but narration was generated successfully');
      }
    }

    return NextResponse.json({
      success,
      results,
      processingTime: endTime - startTime
    });
  } catch (error) {
    logError('Narration endpoint', error, { title: resolvedParams?.title });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate narration',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 