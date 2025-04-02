declare module '@gptscript-ai/gptscript' {
  export interface Frame {
    type: string;
    start?: string;
    end?: string;
    tool?: {
      description: string;
      [key: string]: any;
    };
    input?: any;
    output?: Array<{
      content: string;
      subCalls?: {
        [key: string]: {
          toolID: string;
          input: string;
          [key: string]: any;
        };
      };
      [key: string]: any;
    }>;
    [key: string]: any;
  }

  export enum RunEventType {
    Event = 'event'
  }

  export interface GPTScriptOptions {
    APIKey?: string;
    [key: string]: any;
  }

  export interface RunOpts {
    disableCache?: boolean;
    input?: string;
    [key: string]: any;
  }

  export interface RunResult {
    on(event: RunEventType | string, callback: (data: Frame) => void): void;
    text(): Promise<string>;
    [key: string]: any;
  }

  export class GPTScript {
    constructor(options?: GPTScriptOptions);
    run(script: string, opts?: RunOpts): Promise<RunResult>;
    [key: string]: any;
  }
} 