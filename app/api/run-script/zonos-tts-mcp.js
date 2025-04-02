/**
 * @tools fetch
 * @description Converts text to speech using the zonos-tts-mcp service
 * @param {string} text - (required) The text to convert to speech
 * @param {string} voice - (required) The voice to use for the speech
 * @param {string} output - (required) The output file path to save the audio to
 */

import fs from 'fs/promises';

export default async function textToSpeech({ text, voice, output }) {
  // Call the text-to-speech service
  const response = await fetch("http://localhost:3001/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      voice
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to convert text to speech: ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Save the audio to the output file
  await fs.writeFile(output, uint8Array);
  
  return { success: true, outputPath: output };
} 