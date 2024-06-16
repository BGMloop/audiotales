// File: app/api/run-script/route.js
import { NextRequest } from "next/server";
// import g from "@/lib/gptScriptInstance";
import { RunEventType } from "@gptscript-ai/gptscript";
import g from "@/lib/gptScriptInstance";
import pathResolve from "path";
import fs from "fs";

const script = "app/api/run-script/story-book.gpt";

export async function POST(request: NextRequest) {
  const { story, pages, path } = await request.json();

  const opts = {
    disableCache: true,
    input: `${story ? `--story ${story}` : ""} ${
      pages ? `--pages ${pages}` : ""
    } ${path ? `--path ${path}` : ""}`.trim(),
  };

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const scriptPath = pathResolve.resolve(process.cwd(), script);

          // Log the resolved path
          console.log("Resolved script path:", scriptPath);

          // Check if the file exists
          if (!fs.existsSync(scriptPath)) {
            throw new Error(`Script not found: ${scriptPath}`);
          }

          console.log("Script Path >>>", scriptPath);
          const run = await g.run(scriptPath, opts);

          // ----
          // TUTORIAL: Uncomment the line below to test the script with the input "Hello, World!", I recommend you to test it with the input "Hello, World!" to check your streaming is working correctly.
          //   const run = await g.run("https://get.gptscript.ai/echo.gpt", opts) // Test this with input: "Hello, World!" inside opts
          // ----

          run.on(RunEventType.Event, (data) => {
            controller.enqueue(
              encoder.encode(`event: ${JSON.stringify(data)}\n\n`)
            );
            console.log(JSON.stringify(data));
          });

          await run.text();
          controller.close();
        } catch (error) {
          controller.error(error);
          console.log("ERROR", error);
        } finally {
          //   g.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
    });
  }
}
