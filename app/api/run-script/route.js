import { NextResponse } from 'next/server';
import generateDalleImages from './dalle-image-generation';
import textToSpeech from './zonos-tts-mcp';
import storyWriter from './story-writer';
import generateStoryBook from './story-book';

export async function POST(request) {
  try {
    const { script, params, story, pages, path } = await request.json();
    
    // If story, pages, and path are provided, we're creating a storybook
    if (story && pages && path) {
      // Create a TransformStream to handle streaming
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start the response immediately
      const response = new Response(stream.readable);

      // Process in the background
      (async () => {
        try {
          // Send updates as Server-Sent Events (SSE)
          const sendEvent = async (data) => {
            await writer.write(
              encoder.encode(`event: ${JSON.stringify(data)}\n\n`)
            );
          };

          // Create example event frames for the client
          await sendEvent({
            type: "runStart",
            start: new Date().toISOString(),
          });

          await sendEvent({
            type: "callStart",
            tool: { description: "Starting to process your story" },
          });

          // Call the storybook generator
          const result = await generateStoryBook({ 
            story,
            pages,
            outputPath: path
          });

          // Send completion event
          await sendEvent({
            type: "callFinish",
            output: [{ content: "Story generated successfully" }],
          });

          await sendEvent({
            type: "runFinish",
            end: new Date().toISOString(),
          });

          await writer.close();
        } catch (error) {
          console.error("Error processing stream:", error);
          await writer.write(
            encoder.encode(`event: ${JSON.stringify({
              type: "error",
              error: error.message || "An unknown error occurred"
            })}\n\n`)
          );
          await writer.close();
        }
      })();

      return response;
    }
    
    // Original non-streaming API behavior for specific script calls
    let result;
    
    switch (script) {
      case 'dalle-image-generation':
        result = await generateDalleImages(params);
        break;
      case 'zonos-tts-mcp':
        result = await textToSpeech(params);
        break;
      case 'story-writer':
        result = await storyWriter(params);
        break;
      case 'story-book':
        result = await generateStoryBook(params);
        break;
      default:
        return NextResponse.json(
          { error: `Script '${script}' not found` },
          { status: 404 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error running script:`, error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 