// Available voices in OpenAI's API
export const AVAILABLE_VOICES = [
    'alloy', 'echo', 'fable', 'onyx', 'nova', 
    'shimmer', 'coral', 'sage', 'ash'
  ] as const;
  
  export type Voice = typeof AVAILABLE_VOICES[number]; 