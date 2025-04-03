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
  const [contentFilterError, setContentFilterError] = useState<string | null>(null);

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

      // Try to extract complete events from the buffer
      const events = [];
      const regex = /event: ({.+?})\n\n/g;
      let match;

      while ((match = regex.exec(buffer)) !== null) {
        try {
          // Extract the JSON string
          const jsonStr = match[1];
          // Parse the JSON
          const parsedData = JSON.parse(jsonStr);
          events.push(parsedData);
        } catch (error) {
          // If we can't parse this event, just skip it
          console.error("Failed to parse JSON", error);
        }
      }

      // Remove processed events from the buffer
      buffer = buffer.replace(regex, "");

      // Process the valid events
      events.forEach(parsedData => {
        try {
          if (parsedData.type === "contentFilterError") {
            // Handle content filter error
            setContentFilterError(parsedData.message);
            setRunFinished(true);
            setRunStarted(false);
            setIsLoading(false);
            toast.error("Content filter error: " + parsedData.message);
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
            // Explain: We update the events state with the parsed data.
            setEvents((prevEvents) => [...prevEvents, parsedData]);
          }
        } catch (error) {
          console.error("Error processing event data:", error);
        }
      });
    }
  }, []);

  const runScript = useCallback(async () => {
    setRunStarted(true);
    setRunFinished(false);
    setIsLoading(true);
    setEvents([]);
    setContentFilterError(null);

    try {
      const response = await fetch("/api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story, pages, path: storiesPath }),
      });

      if (response.ok) {
        const contentType = response.headers.get("Content-Type");
        
        // Check if the response is a JSON (content filter error)
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.error === "contentFilterError") {
            setContentFilterError(data.message);
            setRunFinished(true);
            setRunStarted(false);
            setIsLoading(false);
            toast.error("Content filter error: " + data.message);
            return;
          }
        }
        
        // If it's a stream, process it
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          handleStream(reader, decoder);
          console.log("Streaming started");
        } else {
          setRunFinished(true);
          setRunStarted(false);
          setIsLoading(false);
          console.error("Response body is null");
          toast.error("Failed to generate story. Please try again.");
        }
      } else {
        setRunFinished(true);
        setRunStarted(false);
        setIsLoading(false);
        console.error("Failed to start streaming");
        toast.error("Failed to generate story. Please try again.");
      }
    } catch (error) {
      console.error("Error running script:", error);
      setRunFinished(true);
      setRunStarted(false);
      setIsLoading(false);
      toast.error("An error occurred while generating your story.");
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
