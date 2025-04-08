import { Frame } from "@gptscript-ai/gptscript";

// Define our custom event type
interface ContentFilterErrorEvent {
  type: string;  // Use string instead of specific literal
  message: string;
  timestamp: string;
}

// Type guard to check if an event is a ContentFilterErrorEvent
function isContentFilterError(event: any): event is ContentFilterErrorEvent {
  return event && event.type === 'contentFilterError' && typeof event.message === 'string';
}

const renderEventMessage = (event: Frame | ContentFilterErrorEvent) => {
  // Handle content filter errors using type guard
  if (isContentFilterError(event)) {
    return (
      <div className="text-red-400">
        <p><strong>Content Filter:</strong> {event.message}</p>
      </div>
    );
  }

  // Proceed with normal Frame event handling
  switch (event.type) {
    case "runStart":
      return <div>Run started at {event.start}</div>;
    case "callStart":
      return (
        <div>
          <p>Tool Starting: {event.tool?.description}</p>
        </div>
      );
    case "callChat":
      return (
        <div>
          Chat in progress with your input {">>"} {String(event.input)}
        </div>
      );
    case "callProgress":
      return null;
    case "callFinish":
      return (
        <div>
          Call finished:{" "}
          {event.output?.map((output, index) => (
            <div key={`output-${index}-${output.content?.substring(0, 10) || index}`}>
              {output.content}
            </div>
          ))}
        </div>
      );
    case "runFinish":
      return <div>Run finished at {event.end}</div>;
    case "callSubCalls":
      return (
        <div>
          Sub-calls in progress:
          {event.output?.map((output, index) => (
            <div key={`subcall-output-${index}`}>
              <div>{output.content}</div>
              {output.subCalls &&
                Object.keys(output.subCalls).map((subCallKey, subIndex) => (
                  <div key={`subcall-${subCallKey}-${subIndex}`}>
                    <strong>SubCall {subCallKey}:</strong>
                    <div>Tool ID: {output.subCalls[subCallKey].toolID}</div>
                    <div>Input: {output.subCalls[subCallKey].input}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      );
    case "callContinue":
      return (
        <div>
          Call continues:
          {event.output?.map((output, index) => (
            <div key={`continue-output-${index}`}>
              <div>{output.content}</div>
              {output.subCalls &&
                Object.keys(output.subCalls).map((subCallKey, subIndex) => (
                  <div key={`continue-subcall-${subCallKey}-${subIndex}`}>
                    <strong>SubCall {subCallKey}:</strong>
                    <div>Tool ID: {output.subCalls[subCallKey].toolID}</div>
                    <div>Input: {output.subCalls[subCallKey].input}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      );

    case "callConfirm":
      return (
        <div>
          Call confirm:
          {event.output?.map((output, index) => (
            <div key={`confirm-output-${index}`}>
              <div>{output.content}</div>
              {output.subCalls &&
                Object.keys(output.subCalls).map((subCallKey, subIndex) => (
                  <div key={`confirm-subcall-${subCallKey}-${subIndex}`}>
                    <strong>SubCall {subCallKey}:</strong>
                    <div>Tool ID: {output.subCalls[subCallKey].toolID}</div>
                    <div>Input: {output.subCalls[subCallKey].input}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      );
    default:
      return <pre>{JSON.stringify(event, null, 2)}</pre>;
  }
};

export default renderEventMessage;
