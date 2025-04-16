import { NextRequest } from "next/server";
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { useCallback } from 'react';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storiesDirectory = path.join(process.cwd(), "public/stories");

async function ensureDirectoryExists(dir: string) {
  try {
    await fsPromises.access(dir);
  } catch {
    await fsPromises.mkdir(dir, { recursive: true });
  }
}

async function generateImage(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a stunning Disney/Pixar style illustration for a children's storybook scene: ${prompt}. 
The art style should be:
- Highly detailed and polished like classic Disney animation
- Rich, vibrant colors with cinematic lighting
- Expressive characters with clear emotions
- Dynamic composition with depth and atmosphere
- Soft, appealing shapes and forms
- Magical and whimsical atmosphere
- Child-friendly and enchanting
Make it feel like a frame from a Disney animated feature film. Focus on creating an emotionally engaging scene that tells a story.`,
    size: "1024x1024",
    quality: "hd",
    style: "vivid",
    n: 1,
  });

  const imageUrl = response.data[0].url;
  if (!imageUrl) {
    throw new Error("Failed to generate image");
  }
  return imageUrl;
}

async function downloadImage(url: string, filepath: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await fsPromises.writeFile(filepath, new Uint8Array(buffer));
}

function parseStoryContent(content: string): { title: string, pages: string[] } {
  // First, try to extract the title
  const titleMatch = content.match(/\[TITLE\]([\s\S]*?)\[\/TITLE\]/);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled Story";
  
  // Remove the title section from content to avoid interference with page parsing
  const contentWithoutTitle = content.replace(/\[TITLE\][\s\S]*?\[\/TITLE\]/, '').trim();
  
  // Split content into pages
  const pages: string[] = [];
  const pageRegex = /\[PAGE (\d+)\]([\s\S]*?)(?=\[PAGE \d+\]|$)/g;
  let match;
  
  while ((match = pageRegex.exec(contentWithoutTitle)) !== null) {
    const pageContent = match[2].trim();
    pages.push(pageContent);
  }
  
  return { title, pages };
}

export async function POST(request: NextRequest) {
  const { story, pages } = await request.json();

  try {
    // Generate the story text
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a creative children's story writer. Write engaging, age-appropriate stories with clear morals and educational value.
Format your response exactly like this:
[TITLE]Story Title[/TITLE]
[PAGE 1]
First page content...
[PAGE 2]
Second page content...
And so on for each page.`
        },
        {
          role: "user",
          content: `Write a children's story about: "${story}" in exactly ${pages} pages.
Make sure to:
1. Include a title in [TITLE] tags
2. Mark each page with [PAGE X] where X is the page number
3. Make each page about 2-3 paragraphs long
4. Make the story engaging and educational
5. Include vivid descriptions that can be illustrated`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const storyText = completion.choices[0].message.content;
    if (!storyText) {
      throw new Error("No story text generated");
    }
    
    // Parse the story content
    const { title, pages: storyPages } = parseStoryContent(storyText);
    if (storyPages.length === 0) {
      throw new Error("No pages found in generated story");
    }
    
    // Create safe title for directory name
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '-');

    // Create story directory
    const storyDir = path.join(storiesDirectory, safeTitle);
    await ensureDirectoryExists(storyDir);

    const textEncoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send title
          controller.enqueue(
            textEncoder.encode(`event: ${JSON.stringify({
              type: "progress",
              message: `Creating story: ${title}\n`
            })}\n\n`)
          );

          // Process each page
          for (let i = 0; i < storyPages.length; i++) {
            const pageNum = i + 1;
            const pageContent = storyPages[i];
            
            try {
              // Save page text
              const textPath = path.join(storyDir, `page${pageNum}.txt`);
              await fsPromises.writeFile(textPath, pageContent);

              controller.enqueue(
                textEncoder.encode(`event: ${JSON.stringify({
                  type: "progress",
                  message: `Saved page ${pageNum} text\n`
                })}\n\n`)
              );

              // Generate and save image
              controller.enqueue(
                textEncoder.encode(`event: ${JSON.stringify({
                  type: "progress",
                  message: `Generating illustration for page ${pageNum}...\n`
                })}\n\n`)
              );

              const imagePrompt = `Illustration for children's story page: ${pageContent}`;
              const imageUrl = await generateImage(imagePrompt);
              const imagePath = path.join(storyDir, `page${pageNum}.png`);
              await downloadImage(imageUrl, imagePath);

              controller.enqueue(
                textEncoder.encode(`event: ${JSON.stringify({
                  type: "progress",
                  message: `Saved illustration for page ${pageNum}\n`
                })}\n\n`)
              );
            } catch (error) {
              console.error(`Error processing page ${pageNum}:`, error);
              controller.enqueue(
                textEncoder.encode(`event: ${JSON.stringify({
                  type: "error",
                  message: `Error processing page ${pageNum}: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n`
                })}\n\n`)
              );
            }
          }

          // Send completion event
          controller.enqueue(
            textEncoder.encode(`event: ${JSON.stringify({
              type: "runFinish"
            })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Error in stream controller:", error);
          controller.error(error);
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating story:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate story",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}