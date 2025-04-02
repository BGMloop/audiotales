/**
 * @description Writes a story for children. Returns a story, illustration style, list of settings, and a list of characters with their physical descriptions.
 * @param {string} prompt - The prompt to use for the story
 * @param {number} pages - The number of pages that the story should have
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function storyWriter({ prompt, pages }) {
  try {
    const temperature = 1;
    
    const systemPrompt = `You are an accomplished children's story writer. You like to write with a style that is appropriate for children but
is still interesting to read. With your style, write a story based on the given prompt that has ${pages} pages. Along with 
the story, write an extensive description of each character's physical appearance. Be sure to include things like hair
color, skin tone, hair style, species, and any other significant characteristics. Write an extensive description of
what settings in the story look like as well. Finally, determine what style that illustrations of this story should
be written in using 5 or less words.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error(`Failed to generate story: ${error.message}`);
  }
} 