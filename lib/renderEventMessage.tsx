// Define our event types
export enum RunEventType {
  RunStart = 'runStart',
  RunFinish = 'runFinish',
  CallStart = 'callStart',
  CallChat = 'callChat',
  CallSubCalls = 'callSubCalls',
  CallProgress = 'callProgress',
  CallConfirm = 'callConfirm',
  CallContinue = 'callContinue',
  CallFinish = 'callFinish',
  Prompt = 'prompt'
}

export interface Tool {
  description: string;
}

export interface Frame {
  type: RunEventType;
  start?: string;
  end?: string;
  input?: unknown;
  tool?: Tool;
  output?: Array<{
    content: string;
    subCalls?: Record<string, { toolID: string; input: string }>;
  }>;
}

interface ProgressEvent {
  type: 'progress';
  message: string;
  timestamp: string;
}

interface ToolEvent {
  type: 'tool';
  message?: string;
  tool: string;
  timestamp: string;
}

interface ContentFilterEvent {
  type: 'contentFilterError';
  message: string;
  timestamp: string;
}

export type EventType = ProgressEvent | ToolEvent | ContentFilterEvent | Frame;

const renderEventMessage = (event: EventType) => {
  // Handle custom events
  switch (event.type) {
    case 'contentFilterError':
      return (
        <div className="text-red-400">
          <p><strong>Content Filter:</strong> {event.message}</p>
        </div>
      );
    case 'progress':
      return <div>{event.message}</div>;
    case 'tool':
      return <div>Using tool: {event.tool}</div>;
    case RunEventType.RunFinish:
      return <div>Story generation complete!</div>;
    case RunEventType.RunStart:
      return <div>Run started at {event.start}</div>;
    case RunEventType.CallStart:
      return (
        <div>
          <p>Tool Starting: {event.tool?.description}</p>
        </div>
      );
    case RunEventType.CallChat:
      return (
        <div>
          Chat in progress with your input {">>"} {String(event.input || "")}
        </div>
      );
    case RunEventType.CallProgress:
      return null;
    case RunEventType.CallFinish:
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
    case RunEventType.CallSubCalls:
      return (
        <div>
          Sub-calls in progress:
          {event.output?.map((output, index) => (
            <div key={`subcall-output-${index}`}>
              <div>{output.content}</div>
              {output.subCalls && (
                Object.entries(output.subCalls).map(([subCallKey, subCall], subIndex) => (
                  <div key={`subcall-${subCallKey}-${subIndex}`}>
                    <strong>SubCall {subCallKey}:</strong>
                    <div>Tool ID: {subCall.toolID}</div>
                    <div>Input: {subCall.input}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      );
    case RunEventType.CallContinue:
      return (
        <div>
          Call continues:
          {event.output?.map((output, index) => (
            <div key={`continue-output-${index}`}>
              <div>{output.content}</div>
              {output.subCalls && (
                Object.entries(output.subCalls).map(([subCallKey, subCall], subIndex) => (
                  <div key={`continue-subcall-${subCallKey}-${subIndex}`}>
                    <strong>SubCall {subCallKey}:</strong>
                    <div>Tool ID: {subCall.toolID}</div>
                    <div>Input: {subCall.input}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      );
    case RunEventType.CallConfirm:
      return (
        <div>
          Call confirm:
          {event.output?.map((output, index) => (
            <div key={`confirm-output-${index}`}>
              <div>{output.content}</div>
              {output.subCalls && (
                Object.entries(output.subCalls).map(([subCallKey, subCall], subIndex) => (
                  <div key={`confirm-subcall-${subCallKey}-${subIndex}`}>
                    <strong>SubCall {subCallKey}:</strong>
                    <div>Tool ID: {subCall.toolID}</div>
                    <div>Input: {subCall.input}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      );
    default:
      return <div>Unknown event</div>;
  }
};

export default renderEventMessage;
