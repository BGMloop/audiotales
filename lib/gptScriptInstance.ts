// File: lib/gptscriptInstance.js
import { GPTScript } from "@gptscript-ai/gptscript";

// Get the API key from environment variables
  const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set in environment variables. Please add it to your .env.local file.");
}

let gptScriptInstance: GPTScript | null = null;

try {
  gptScriptInstance = new GPTScript({
    APIKey: apiKey,
  });
} catch (error) {
  console.error("Failed to initialize GPTScript:", error);
  throw new Error("Failed to initialize GPTScript. Please check your API key and try again.");
}

export default gptScriptInstance;
