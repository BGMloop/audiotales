// File: app/api/run-script/route.js
import { NextRequest } from "next/server";
// import g from "@/lib/gptScriptInstance";
import { RunEventType } from "@gptscript-ai/gptscript";
import g from "@/lib/gptScriptInstance";

const script = "./story-book.gpt";

export async function POST(request: NextRequest) {
  const { story, pages, path } = await request.json();

  //   console.log("HERE >>>", g);

  const opts = {
    disableCache: true,
    story: "Foo",
    pages: "1",
    path: "stories",
    input: "Hello, World!",
  };

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const run = await g.run("https://get.gptscript.ai/echo.gpt", opts);

          // ----
          // TUTORIAL: Uncomment the line below to test the script with the input "Hello, World!", I recommend you to test it with the input "Hello, World!" to check your streaming is working correctly.
          //   const run = await g.run("https://get.gptscript.ai/echo.gpt", opts) // Test this with input: "Hello, World!" inside opts
          // ----

          run.on(RunEventType.Event, (data) => {
            controller.enqueue(
              encoder.encode(`event: ${JSON.stringify(data)}\n\n`)
            );
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
