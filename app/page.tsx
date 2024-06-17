"use client";

// https://tools.gptscript.ai/

import renderEventMessage from "@/lib/renderEventMessage";
import { Frame } from "@gptscript-ai/gptscript";
import { useState } from "react";

const showLogs = false;

export default function Home() {
  const [story, setStory] = useState(
    "Write a story about a robot and a human who become friends."
  );
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<Frame[]>([]);
  const [progress, setProgress] = useState("");
  const [currentTool, setCurrentTool] = useState("");
  const [pages, setPages] = useState(2);
  const [path, setPath] = useState("stories");
  const [runFinished, setRunFinished] = useState(false);

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
    setRunFinished(false);

    const response = await fetch("/api/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ story, pages, path }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      handleStream(reader, decoder);
      console.log("Streaming started");
    } else {
      setRunFinished(true);
      console.error("Failed to start streaming");
    }
  }

  return (
    <div>
      <h1>GPTScript App</h1>
      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        placeholder="Enter your story here"
        className="text-black"
      ></textarea>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter input here"
      />
      <button onClick={runScript}>Run Script</button>
      <div>
        <h2>Events:</h2>
        {currentTool && <div>Current Tool: {currentTool}</div>}
        {runFinished && <div>Run Finished</div>}

        {/* --- Enable showLogs TO SEE LOGS --- */}
        {showLogs &&
          events.map((event, index) => (
            <div key={index}>{renderEventMessage(event)}</div>
          ))}
        {/* --- */}

        {progress && <div>Progress: {progress}</div>}
      </div>
    </div>
  );
}

// --- HELPER FUNCTION TO RENDER EVENTS ---
