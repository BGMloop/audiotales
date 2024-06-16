import gptscript from "@gptscript-ai/gptscript";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

// In this case, we want a prompt and the number of pages.
type Request = {
  prompt: string;
  pages: number;
};

// Here's a type to store executions of running GPTScripts.
type RunningScript = {
  stdout: Readable;
  stderr: Readable;
  promise: Promise<void>;
};

// We're not using a database in this tutorial, so we'll simply store them in memory.
// It's all for the sake of simplicity and demonstration.
export const runningScripts: Record<string, RunningScript> = {};

export async function POST(req: NextRequest) {
  const { prompt, pages } = await req.json();

  if (!prompt) {
    return NextResponse.json({
      status: 400,
      body: "Please provide a prompt.",
    });
  }

  if (!pages) {
    return NextResponse.json({
      status: 400,
      body: "Please provide the number of pages.",
    });
  }

  const { stdout, stderr, promise } = await gptscript.streamExecFile(
    "story-book.gpt",
    `--story ${prompt} --pages ${pages}`,
    {}
  );

  // We add the running script to our in-memory store.
  runningScripts[prompt] = {
    stdout: stdout,
    stderr: stderr,
    promise: promise,
  };

  //  setResponseStatus(event, 202)
  return NextResponse.json({
    status: 202,
    body: "The script is running.",
  });
}
