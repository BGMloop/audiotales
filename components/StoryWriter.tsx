"use client";

// https://tools.gptscript.ai/
const showLogs = true;

// The path where the stories will be saved.
// NOTE must be inside public folder for images to load
const storiesPath = "public/stories";

import renderEventMessage from "@/lib/renderEventMessage";
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
import { EventType } from '@/lib/renderEventMessage';

function StoryWriter() {
  const [story, setStory] = useState<string>("");
  const [events, setEvents] = useState<EventType[]>([]);
  const [progress, setProgress] = useState("");
  const [currentTool, setCurrentTool] = useState("");
  const [pages, setPages] = useState<number>();
  const [runFinished, setRunFinished] = useState<boolean | null>(null);
  const [runStarted, setRunStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [contentFilterError, setContentFilterError] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>("");

  const router = useRouter();

  // Calculate estimated time based on number of pages
  useEffect(() => {
    if (pages) {
      // Estimate: ~1 minute per page for text generation + ~30 seconds per page for DALL-E image
      const totalMinutes = pages * 1.5;
      setEstimatedTime(`Estimated time: ${totalMinutes.toFixed(1)} minutes`);
    } else {
      setEstimatedTime("");
    }
  }, [pages]);

  const handleStream = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log("Stream complete");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        lines.forEach((line) => {
          if (line.startsWith("event: ")) {
            try {
              const eventData = line.slice(7); // Remove "event: " prefix
              const parsedData = JSON.parse(eventData);
              
              if (parsedData.type === "progress") {
                setProgress(parsedData.message);
              } else if (parsedData.type === "tool") {
                setCurrentTool(parsedData.message);
              } else if (parsedData.type === "runFinish") {
                setRunFinished(true);
                setRunStarted(false);
                setIsLoading(false);
              } else {
                setEvents((prevEvents) => [...prevEvents, parsedData]);
              }
            } catch (error) {
              console.error("Error processing event data:", error);
            }
          }
        });
      }
    } catch (error) {
      console.error("Stream reading error:", error);
      setRunFinished(true);
      setRunStarted(false);
      setIsLoading(false);
      toast.error("Lost connection to the story generator. Please try again.");
    }
  }, []);

  const runScript = useCallback(async () => {
    setRunStarted(true);
    setRunFinished(false);
    setIsLoading(true);
    setEvents([]);
    setContentFilterError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    try {
      const response = await fetch("/api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story, pages, path: storiesPath }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to generate story');
      }

      const contentType = response.headers.get("Content-Type");
      
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        if (data.error === "contentFilterError") {
          setContentFilterError(data.message);
          toast.error("Content filter error: " + data.message);
          return;
        }
        throw new Error(data.details || 'Unexpected JSON response');
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      console.log("Streaming started");
      await handleStream(reader, decoder);
      
    } catch (error) {
      console.error("Error running script:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while generating your story.");
    } finally {
      setRunFinished(true);
      setRunStarted(false);
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
  }, [story, pages, handleStream]);

  useEffect(() => {
    if (runFinished) {
      if (!contentFilterError) {
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
  }, [runFinished, router, contentFilterError]);

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
            {Array.from({ length: 20 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {i + 1} {i === 0 ? "page" : "pages"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {estimatedTime && (
          <div className="text-sm text-gray-600 mt-2 mb-4">
            {estimatedTime}
          </div>
        )}

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
        {runFinished && !contentFilterError && (
          <div className="text-green-500 font-bold mb-2">Story Generated Successfully!</div>
        )}
        
        {contentFilterError && (
          <div className="text-red-500 font-bold mb-2 p-4 border border-red-300 rounded bg-red-50">
            <h3 className="text-lg mb-2">Content Filter Alert</h3>
            <p>{contentFilterError}</p>
            <p className="mt-2 text-sm">Please try a different story idea that's more appropriate for children.</p>
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
                {"--- [AudioTales AI Has Started] ---"}
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
