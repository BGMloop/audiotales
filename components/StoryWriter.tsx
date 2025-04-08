"use client";

// https://tools.gptscript.ai/
const showLogs = true;

// The path where the stories will be saved.
// NOTE must be inside public folder for images to load
const storiesPath = "public/stories";

import renderEventMessage from "@/lib/renderEventMessage";
import { Frame } from "@gptscript-ai/gptscript";
import { useCallback, useEffect, useState } from "react";
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
  const [story, setStory] = useState<string>("");
  const [events, setEvents] = useState<Frame[]>([]);
  const [progress, setProgress] = useState("");
  const [currentTool, setCurrentTool] = useState("");
  const [pages, setPages] = useState<number>();
  const [runFinished, setRunFinished] = useState<boolean | null>(null);
  const [runStarted, setRunStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ code: string; message: string; details?: string } | null>(null);

  const router = useRouter();

  const handleStream = useCallback(async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) => {
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk and add it to our buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete data events from the buffer
      const lines = buffer.split('\n');
      buffer = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            const parsedData = JSON.parse(jsonStr);

            if (parsedData.type === "error") {
              setError(parsedData);
              setRunFinished(true);
              setRunStarted(false);
              setIsLoading(false);
              
              let errorMessage = parsedData.message;
              if (parsedData.details) {
                errorMessage += `: ${parsedData.details}`;
              }
              
              toast.error(errorMessage);
            } else if (parsedData.type === "callProgress") {
              setProgress(
                parsedData.output[parsedData.output.length - 1].content
              );
              setCurrentTool(parsedData.tool?.description || "");
            } else if (parsedData.type === "callStart") {
              setCurrentTool(parsedData.tool?.description || "");
            } else if (parsedData.type === "runFinish") {
              setRunFinished(true);
              setRunStarted(false);
              setIsLoading(false);
            } else {
              // Update events state with the parsed data
              setEvents((prevEvents) => [...prevEvents, parsedData]);
            }
          } catch (error) {
            console.error("Error processing event data:", error);
          }
        }
      }
    }
  }, []);

  const runScript = useCallback(async () => {
    setRunStarted(true);
    setRunFinished(false);
    setIsLoading(true);
    setEvents([]);
    setError(null);

    try {
      const response = await fetch("/api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story, pages, path: storiesPath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError({
          code: "API_ERROR",
          message: errorData.error || "Failed to generate story",
          details: errorData.details
        });
        setRunFinished(true);
        setRunStarted(false);
        setIsLoading(false);
        toast.error(errorData.error || "Failed to generate story. Please try again.");
        return;
      }

      // Process the stream
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        await handleStream(reader, decoder);
        console.log("Streaming completed");
      } else {
        setError({
          code: "STREAM_ERROR",
          message: "Failed to generate story",
          details: "Response body is null"
        });
        setRunFinished(true);
        setRunStarted(false);
        setIsLoading(false);
        console.error("Response body is null");
        toast.error("Failed to generate story. Please try again.");
      }
    } catch (error) {
      console.error("Error running script:", error);
      setError({
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
        details: error instanceof Error ? error.message : "Unknown error"
      });
      setRunFinished(true);
      setRunStarted(false);
      setIsLoading(false);
      toast.error("Network error. Please check your connection and try again.");
    }
  }, [story, pages, handleStream]);

  useEffect(() => {
    if (runFinished) {
      if (!error) {
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
    }
  }, [runFinished, router, error]);

  return (
    <div className="flex flex-col container">
      <section className="flex-1 flex flex-col border border-purple-300 rounded-md p-10 space-y-2">
        <Textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Write a story about a robot and a human who become friends..."
          className="text-black flex-1"
          disabled={isLoading}
        />

        <Select 
          onValueChange={(value) => setPages(parseInt(value))}
          disabled={isLoading}
        >
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
          {isLoading ? (
            <span>Generating Story... Please wait</span>
          ) : (
            "Generate Story"
          )}
        </Button>
      </section>

      {/* --- AI VIEWER --- */}
      <div className="flex-1 pb-5 mt-5">
        {runFinished && !error && (
          <div className="text-green-500 font-bold mb-2">Story Generated Successfully!</div>
        )}
        
        {error && (
          <div className="text-red-500 font-bold mb-2 p-4 border border-red-300 rounded bg-red-50">
            <h3 className="text-lg mb-2">Error</h3>
            <p>{error.message}</p>
            {error.details && (
              <p className="mt-2 text-sm">{error.details}</p>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse w-full space-y-2 bg-gray-800 rounded-md text-gray-200 font-mono p-10 h-96 overflow-y-scroll">
          <div>
            {runFinished === null && (
              <>
                <span className="mr-5 animate-pulse">
                  I'm waiting for you to generate a story above...
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
              <div key={`event-${index}`} className="flex">
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
