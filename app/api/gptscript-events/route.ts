// Import the in-memory store for running scripts
import { runningScripts } from "../gptscript/route";
import { NextRequest } from "next/server";

// Convert async iterator to stream
function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

// Define the Next.js handler.
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  // The prompt is the key to retrieve the value from the runningScripts store.
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return new Response(null, {
      status: 400,
      statusText: "prompt is required",
    });
  }

  // Retrieve the running script from the store
  const runningScript = runningScripts[prompt as string];
  if (!runningScript) {
    return new Response(null, {
      status: 404,
      statusText: "running script not found",
    });
  }

  // Create an async iterator from the running script
  // Generator functions are a special kind of function that can be exited and later re-entered, with their context (variable bindings) being saved across re-entrances. They are defined using the function* syntax.
  async function* makeIterator() {
    for await (const data of runningScript.stdout) {
      yield data;
    }
    for await (const data of runningScript.stderr) {
      yield data;
    }
    try {
      await runningScript.promise;
      yield "done";
    } catch (error) {
      yield `error: ${error}`;
    }
  }

  const iterator = makeIterator();
  const stream = iteratorToStream(iterator);

  return new Response(stream, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
