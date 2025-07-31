import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import dotenv from 'dotenv';
import { dirname } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(dirname(__dirname), '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storiesDirectory = path.join(process.cwd(), "public/stories");

// Character reference tracking
const characterReferences = new Map();

function getCharacterReference(storyTitle, characterName) {
  const key = `${storyTitle}-${characterName}`;
  return characterReferences.get(key);
}

function setCharacterReference(storyTitle, characterName, reference) {
  const key = `${storyTitle}-${characterName}`;
  characterReferences.set(key, reference);
}

async function generateImage(prompt, storyTitle, characterName, previousImageUrl = null) {
  let characterReference = '';
  if (characterName) {
    characterReference = getCharacterReference(storyTitle, characterName);
    if (!characterReference && previousImageUrl) {
      characterReference = `Reference image: ${previousImageUrl}`;
      setCharacterReference(storyTitle, characterName, characterReference);
    }
  }

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a stunning Disney Renaissance era (1989-1999) illustration for a children's storybook scene: ${prompt}. 
The art style must be:
- EXACT Disney Renaissance era style with vivid colors and classic hand-drawn appeal
- Precise 16:9 cinematic framing with clear foreground, midground, and background elements
- Crisp, clean linework with cel-shaded coloring technique
- Rich, vibrant colors with cinematic lighting
- Expressive characters with clear emotions
- Dynamic composition with depth and atmosphere
- Soft, appealing shapes and forms
- Magical and whimsical atmosphere
- Child-friendly and enchanting

${characterReference ? `Character consistency requirements:
- Character MUST maintain EXACTLY the same:
  * Physical features (face shape, body type, species traits)
  * Clothing/accessories (identical colors, style, and design)
  * Color palette (exact same fur/skin/hair/eye colors)
  * Proportions and scale relative to other characters
${characterReference}` : ''}

DO NOT:
- Change a character's species, coloring, or clothing between illustrations
- Alter character designs or physical features between scenes
- Deviate from the classic Disney animation style
- Create realistic or photographic imagery`,
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

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await fs.promises.writeFile(filepath, new Uint8Array(buffer));
}

async function regenerateStoryImages(storyTitle) {
  console.log(`Processing story: ${storyTitle}`);
  const storyDir = path.join(storiesDirectory, storyTitle);
  
  // Check if story directory exists
  try {
    await fs.promises.access(storyDir);
  } catch {
    console.error(`Story directory not found: ${storyDir}`);
    return;
  }

  // Get all text files
  const files = await fs.promises.readdir(storyDir);
  const textFiles = files.filter(f => f.endsWith('.txt') && f.startsWith('page'));

  // Process each page
  for (const textFile of textFiles) {
    const pageNum = textFile.match(/\d+/)?.[0];
    if (!pageNum) continue;

    console.log(`\nProcessing page ${pageNum}`);
    
    // Read page content
    const textPath = path.join(storyDir, textFile);
    const pageContent = await fs.promises.readFile(textPath, 'utf-8');
    
    // Extract character names from the story title
    const characterName = storyTitle.split('--')[0].split('-').join(' ');
    
    // Get previous image URL for character reference
    const previousImagePath = path.join(storyDir, `page${parseInt(pageNum) - 1}.png`);
    let previousImageUrl = null;
    try {
      await fs.promises.access(previousImagePath);
      previousImageUrl = previousImagePath;
    } catch {
      // No previous image exists
    }
    
    // Generate new image
    console.log('Generating new illustration...');
    const imagePrompt = `Illustration for children's story page: ${pageContent}`;
    const imageUrl = await generateImage(imagePrompt, storyTitle, characterName, previousImageUrl);
    
    // Save new image
    const imagePath = path.join(storyDir, `page${pageNum}.png`);
    await downloadImage(imageUrl, imagePath);
    console.log(`Saved new illustration for page ${pageNum}`);
  }

  console.log(`\nCompleted regenerating images for: ${storyTitle}`);
}

async function main() {
  const storiesToRegenerate = [
    'Bouncing-Back--The-Story-of-Sam',
    'Cameron-Bobcat-s-Tricycle-Adventure',
    'Felix-and-the-Glittering-Stream',
    'Howard-the-Friendly-Shark',
    'Onyx-s-Quest--An-Owl-s-Journey-to-Self-Discovery',
    'Onyx-the-Owl-and-the-Journey-of-Self-Discovery',
    'Onyx-the-Owl-s-Quest-for-Purpose',
    'Pierre-Penne-and-the-Adventure-in-Neverland',
    'The-Bobcat-of-Kasukabe--A-Japanese-Adventure',
  ];

  for (const story of storiesToRegenerate) {
    await regenerateStoryImages(story);
  }
}

main().catch(console.error); 