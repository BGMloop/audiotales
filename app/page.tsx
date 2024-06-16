// File: app/page.js
"use client";

import { EventData } from "@/types";
import { useState } from "react";

export default function Home() {
  const [script, setScript] = useState("");
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<EventData[]>([]);

  async function runScript() {
    const response = await fetch("/api/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ script, input }),
    });

    console.log(response);
    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log(chunk);

        const eventData = chunk
          .split("\n\n")
          .filter((line) => line.startsWith("event: "))
          .map((line) => line.replace(/^event: /, ""));

        eventData.forEach((data) => {
          try {
            const parsedData = JSON.parse(data);
            setEvents((prevEvents) => [...prevEvents, parsedData]);
          } catch (error) {
            console.error("Failed to parse JSON", error);
          }
        });
      }

      console.log("Streaming started");
    } else {
      console.error("Failed to start streaming");
    }
  }

  const renderEventMessage = (event: EventData) => {
    switch (event.type) {
      case "runStart":
        return <div>Run started at {event.start}</div>;
      case "callStart":
        return <div>Call started: {event.tool?.description}</div>;
      case "callChat":
        return (
          <div>
            Chat in progress with your input {">>"} {event.input}
          </div>
        );
      case "callProgress":
        return (
          <div>
            Progress: {event.output?.map((output) => output.content).join(", ")}
          </div>
        );
      case "callFinish":
        return (
          <div>
            Call finished:{" "}
            {event.output?.map((output) => output.content).join(", ")}
          </div>
        );
      case "runFinish":
        return <div>Run finished at {event.end}</div>;
      default:
        return <div>Unknown event type</div>;
    }
  };

  return (
    <div>
      <h1>GPTScript App</h1>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Enter your script here"
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
        {events.map((event, index) => (
          <div key={index}>{renderEventMessage(event)}</div>
        ))}
        {/* <pre>{JSON.stringify(events, null, 2)}</pre> */}
      </div>
    </div>
  );
}
