import { NextResponse } from "next/server";
import { NarrationService } from "../../../../../lib/narrationService";
import path from "path";
import fs from "fs";

const outputDirectory = path.join(process.cwd(), "public/test-narrations");

function logError(context: string, error: any, additionalInfo: any = {}) {
  console.error(`Error in ${context}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalInfo
  });
}

export async function POST(
  request: Request,
  { params }: { params: { title: string } }
) {
  const startTime = Date.now();
  try {
    // Ensure params.title is awaited and decoded
    const title = await Promise.resolve(params.title);
    console.log('Starting test narration for:', title);
    
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
      logError('Voice sample check', 'Voice not found', { voiceSample, voices });
      return NextResponse.json(
        { 
          error: "Voice sample not found",
          details: `Voice '${voiceSample}' not found in available voices: ${voices.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Create test output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Generate test narration
    const decodedTitle = decodeURIComponent(title);
    const testOutputPath = path.join(outputDirectory, `${decodedTitle}-test.mp3`);
    const result = await narrationService.testNarration({
      voiceSample,
      text: 'This is a test of the narration system.',
      outputPath: testOutputPath
    });

    if (!result.success) {
      logError('Test narration', result.error || 'Unknown error', { result });
      return NextResponse.json({
        error: "Failed to generate test narration",
        details: result.error
      }, { status: 500 });
    }

    const endTime = Date.now();
    console.log(`Test narration completed in ${endTime - startTime}ms`);

    return NextResponse.json({
      success: true,
      audioPath: result.audioPath,
      quality: result.quality,
      processingTime: endTime - startTime
    });
  } catch (error) {
    logError('Test narration endpoint', error, { title: params.title });
    return NextResponse.json(
      { 
        error: "Failed to test narration",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 