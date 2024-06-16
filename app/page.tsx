"use client";

import { EventData } from "@/types";
import { useState } from "react";

export default function Home() {
  const [story, setStory] = useState(
    "Write a story about a robot and a human who become friends."
  );
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<EventData[]>([]);
  const [progress, setProgress] = useState("");
  const [currentTool, setCurrentTool] = useState("");
  const [pages, setPages] = useState(1);
  const [path, setPath] = useState("stories");

  async function runScript() {
    const response = await fetch("/api/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ story, pages, path }),
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
            if (parsedData.type === "callProgress") {
              setProgress(
                parsedData.output[parsedData.output.length - 1].content
              );
              setCurrentTool(parsedData.tool?.description || "");
            } else {
              setEvents((prevEvents) => [...prevEvents, parsedData]);
            }
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

  // const renderEventMessage = (event: EventData) => {
  //   switch (event.type) {
  //     case "runStart":
  //       return <div>Run started at {event.start}</div>;
  //     case "callStart":
  //       return (
  //         <div>
  //           <p>Tool Starting: {event.tool?.description}</p>
  //         </div>
  //       );
  //     case "callChat":
  //       return (
  //         <div>
  //           Chat in progress with your input {">>"} {event.input}
  //         </div>
  //       );
  //     case "callProgress":
  //       return null;
  //     case "callFinish":
  //       return (
  //         <div>
  //           Call finished:{" "}
  //           {event.output?.map((output) => (
  //             <div key={output.content}>{output.content}</div>
  //           ))}
  //         </div>
  //       );
  //     case "runFinish":
  //       return <div>Run finished at {event.end}</div>;
  //     case "callSubCalls":
  //       return (
  //         <div>
  //           Sub-calls in progress:
  //           {event.output?.map((output, index) => (
  //             <div key={index}>
  //               <div>{output.content}</div>
  //               {output.subCalls &&
  //                 Object.keys(output.subCalls).map((subCallKey) => (
  //                   <div key={subCallKey}>
  //                     <strong>SubCall {subCallKey}:</strong>
  //                     <div>Tool ID: {output.subCalls[subCallKey].toolID}</div>
  //                     <div>Input: {output.subCalls[subCallKey].input}</div>
  //                   </div>
  //                 ))}
  //             </div>
  //           ))}
  //         </div>
  //       );
  //     case "callContinue":
  //       return (
  //         <div>
  //           Call continues:
  //           {event.output?.map((output, index) => (
  //             <div key={index}>
  //               <div>{output.content}</div>
  //               {output.subCalls &&
  //                 Object.keys(output.subCalls).map((subCallKey) => (
  //                   <div key={subCallKey}>
  //                     <strong>SubCall {subCallKey}:</strong>
  //                     <div>Tool ID: {output.subCalls[subCallKey].toolID}</div>
  //                     <div>Input: {output.subCalls[subCallKey].input}</div>
  //                   </div>
  //                 ))}
  //             </div>
  //           ))}
  //         </div>
  //       );
  //     default:
  //       return <pre>{JSON.stringify(event, null, 2)}</pre>;
  //   }
  // };

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
        {progress && <div>Progress: {progress}</div>}
        {/* {events.map((event, index) => (
          <div key={index}>{renderEventMessage(event)}</div>
        ))} */}
      </div>
    </div>
  );
}
