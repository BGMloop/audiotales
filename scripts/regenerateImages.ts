import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storiesDirectory = path.join(process.cwd(), "public/stories");

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

async function regenerateStoryImages(storyTitle: string) {
  console.log(`Processing story: ${storyTitle}`);
  const storyDir = path.join(storiesDirectory, storyTitle);
  
  // Check if story directory exists
  try {
    await fsPromises.access(storyDir);
  } catch {
    console.error(`Story directory not found: ${storyDir}`);
    return;
  }

  // Get all text files
  const files = await fsPromises.readdir(storyDir);
  const textFiles = files.filter(f => f.endsWith('.txt') && f.startsWith('page'));

  // Process each page
  for (const textFile of textFiles) {
    const pageNum = textFile.match(/\d+/)?.[0];
    if (!pageNum) continue;

    console.log(`\nProcessing page ${pageNum}`);
    
    // Read page content
    const textPath = path.join(storyDir, textFile);
    const pageContent = await fsPromises.readFile(textPath, 'utf-8');
    
    // Generate new image
    console.log('Generating new illustration...');
    const imagePrompt = `Illustration for children's story page: ${pageContent}`;
    const imageUrl = await generateImage(imagePrompt);
    
    // Save new image
    const imagePath = path.join(storyDir, `page${pageNum}.png`);
    await downloadImage(imageUrl, imagePath);
    console.log(`Saved new illustration for page ${pageNum}`);
  }

  console.log(`\nCompleted regenerating images for: ${storyTitle}`);
}

async function main() {
  const storiesToRegenerate = [
    'Barnaby-the-Badger-s-Blueberry-Adventure',
    'Felix-s-First-Adventure',
    'Milo-s-Computer-Adventure',
    'Onyx-s-Adventure'
  ];

  for (const story of storiesToRegenerate) {
    await regenerateStoryImages(story);
  }
}

main().catch(console.error); 