export interface Tool {
  description: string;
  modelName: string;
  internalPrompt: string | null;
  arguments: {
    properties: {
      input: {
        description: string;
        type: string;
      };
    };
    type: string;
  };
  instructions: string;
  id: string;
  localTools: {
    [key: string]: string;
  };
  source: {
    location: string;
    lineNo: number;
  };
  workingDir: string;
}

export interface LLMRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature: number;
}

export interface LLMResponse {
  role: string;
  content: {
    text: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Program {
  name: string;
  entryToolId: string;
  toolSet: {
    [key: string]: Tool;
  };
}

export interface EventData {
  id: string;
  program?: Program;
  tool?: Tool;
  inputContext?: string | null;
  type: string;
  start: string;
  end: string;
  input: string;
  output?: {
    content: string;
    subCalls?: string | null;
  }[];
  usage?: object;
  llmRequest?: LLMRequest | null;
  llmResponse?: LLMResponse | null;
  state?: string;
  error?: string;
  chatState?: string | null;
}
