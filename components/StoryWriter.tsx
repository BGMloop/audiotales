"use client";

// https://tools.gptscript.ai/
const showLogs = true;

// The path where the stories will be saved.
// NOTE must be inside public folder for images to load
const storiesPath = "public/stories";

import renderEventMessage from "@/lib/renderEventMessage";
import { Frame } from "@gptscript-ai/gptscript";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function StoryWriter() {
  const [story, setStory] = useState<string>();
  const [events, setEvents] = useState<Frame[]>([]);
  const [progress, setProgress] = useState("");
  const [currentTool, setCurrentTool] = useState("");
  const [pages, setPages] = useState<number>();
  const [runFinished, setRunFinished] = useState<boolean | null>(null);
  const [runStarted, setRunStarted] = useState<boolean>(false);

  const router = useRouter();

  async function handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Explanation: The decoder is used to decode the Uint8Array into a string.
      const chunk = decoder.decode(value, { stream: true });

      // Explanation: We split the chunk into events by splitting it by the event: keyword.
      const eventData = chunk
        .split("\n\n")
        .filter((line) => line.startsWith("event: "))
        .map((line) => line.replace(/^event: /, ""));

      // Explanation: We parse the JSON data and update the state accordingly.
      eventData.forEach((data) => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === "callProgress") {
            setProgress(
              parsedData.output[parsedData.output.length - 1].content
            );
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "callStart") {
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "runFinish") {
            setRunFinished(true);

            setRunStarted(false);
          } else {
            // Explain: We update the events state with the parsed data.
            setEvents((prevEvents) => [...prevEvents, parsedData]);
          }
        } catch (error) {
          console.error("Failed to parse JSON", error);
        }
      });
    }
  }

  async function runScript() {
    setRunStarted(true);
    setRunFinished(false);

    const response = await fetch("/api/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ story, pages, path: storiesPath }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      handleStream(reader, decoder);
      console.log("Streaming started");
    } else {
      setRunFinished(true);
      setRunStarted(false);
      console.error("Failed to start streaming");
    }
  }

  useEffect(() => {
    if (runFinished) {
      toast.success("Story generated successfully!", {
        action: (
          <Button
            onClick={() => router.push("/stories")}
            className="bg-purple-500 ml-auto"
          >
            View Stories
          </Button>
        ),
      });
    }
  }, [runFinished, router]);

  return (
    <div className="flex flex-col container">
      <section className="flex-1 flex flex-col border border-purple-300 rounded-md p-10 space-y-2">
        <Textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Write a story about a robot and a human who become friends..."
          className="text-black flex-1"
        />

        <Select onValueChange={(value) => setPages(parseInt(value))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="How many pages should the story be?" />
          </SelectTrigger>
          <SelectContent className="w-full">
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {i + 1} {i === 0 ? "page" : "pages"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          disabled={!story || !pages || runStarted}
          className="w-full"
          size="lg"
          onClick={runScript}
        >
          {runStarted ? "Generating Story..." : "Generate Story"}
        </Button>
      </section>

      {/* --- AI VIEWER --- */}
      <div className="flex-1 pb-5 mt-5">
        {runFinished && <div>Run Finished</div>}

        <div className="flex flex-col-reverse w-full space-y-2 bg-gray-800 rounded-md text-gray-200 font-mono p-10 h-96 overflow-y-scroll">
          <div>
            {runFinished === null && (
              <>
                <span className="mr-5 animate-pulse">
                  Im waiting for you to Generate a story above...
                </span>
                <br />
              </>
            )}
            <span className="mr-5">{">>"}</span>
            {progress}
          </div>

          {currentTool && (
            <div className="py-10">
              <span className="mr-5">{"--- [Current Tool] ---"}</span>

              {currentTool}
            </div>
          )}

          <div className="space-y-5">
            {events.map((event, index) => (
              <div key={index} className="flex">
                <span className="mr-5">{">>"}</span>
                {renderEventMessage(event)}
              </div>
            ))}
          </div>

          {runStarted && (
            <div>
              <span className="mr-5 animate-in">
                {"--- [AI Storyteller Has Started] ---"}
              </span>
              <br />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryWriter;
