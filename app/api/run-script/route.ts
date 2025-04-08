import { NextRequest } from "next/server";
import { RunEventType, RunOpts } from "@gptscript-ai/gptscript";
import gptScriptInstance from "@/lib/gptScriptInstance";

const script = "app/api/run-script/story-book.gpt";

export async function POST(request: NextRequest) {
  if (!gptScriptInstance) {
    return new Response(
      JSON.stringify({
        error: "GPTScript not initialized. Please check your API key.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Assert that gptScriptInstance is not null after the check
  const gptScript = gptScriptInstance;

  try {
    const { story, pages, path } = await request.json();

    // Updated to include better error handling
    const opts: RunOpts = {
      disableCache: true,
      input: `${story ? ` --story ${story}` : ""} ${
        pages ? `--pages ${pages}` : ""
      } ${path ? `--path ${path}` : ""}`.trim(),
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("Starting GPTScript run with options:", JSON.stringify(opts));
          const run = await gptScript.run(script, opts);

          run.on(RunEventType.Event, (data) => {
            try {
              // Ensure the data is proper JSON by validating it first
              const jsonStr = JSON.stringify(data);
              // Format the event data properly
              controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
            } catch (error) {
              console.error("Error formatting event data:", error);
              // Don't throw here, just log the error and continue
            }
          });

          try {
            await run.text();
            console.log("GPTScript run completed successfully");
            controller.close();
          } catch (error) {
            console.error("Error in GPTScript execution:", error);
            
            // Handle illustration generation errors specifically
            if (error instanceof Error && error.message.includes("Unable to generate the illustration")) {
              const errorEvent = {
                type: "error",
                code: "ILLUSTRATION_ERROR",
                message: "Failed to generate illustration. Please try again.",
                details: error.message,
                timestamp: new Date().toISOString()
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
              controller.close();
              return;
            }

            // Handle other GPTScript errors
            const errorEvent = {
              type: "error",
              code: "GPTSCRIPT_ERROR",
              message: "An error occurred while generating the story",
              details: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString()
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            controller.close();
          }
        } catch (error) {
          console.error("Error in stream processing:", error);
          const errorEvent = {
            type: "error",
            code: "STREAM_ERROR",
            message: "Failed to process the story generation stream",
            details: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
