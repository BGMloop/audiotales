/**
 * @tools story-writer
 * @description Writes a children's book, generates illustrations, and creates audio narrations for it.
 * @param {string} story - The story to write and illustrate. Can be a prompt or a complete story.
 * @param {number} pages - The number of pages to generate
 * @param {string} path - The path that the story should be written to
 */

import fs from 'fs/promises';
import path from 'path';
import storyWriter from './story-writer';
import generateDalleImages from './dalle-image-generation';
import textToSpeech from './zonos-tts-mcp';

export default async function generateStoryBook({ story, pages, outputPath }) {
  // Check if story is appropriate for children
  if (isInappropriateForChildren(story)) {
    throw new Error(`Story is inappropriate for children: ${story}`);
  }

  // Come up with a title
  const storyTitle = generateTitleFromStory(story);
  const dirName = storyTitle.replace(/\s+/g, '-');
  
  // Create the directory
  const storyDir = path.join(outputPath, dirName);
  await fs.mkdir(storyDir, { recursive: true });
  
  // Generate or use existing story
  let fullStory = story;
  if (isPromptNotFullStory(story)) {
    fullStory = await storyWriter({ prompt: story, pages });
    
    // Check again for appropriateness
    if (isInappropriateForChildren(fullStory)) {
      throw new Error(`Generated story is inappropriate for children`);
    }
  }
  
  // Split into pages
  const storyPages = splitIntoPages(fullStory, pages);
  
  // Process each page
  for (let i = 0; i < storyPages.length; i++) {
    const pageNum = i + 1;
    const pageContent = storyPages[i];
    
    // Write page content
    await fs.writeFile(`${storyDir}/page${pageNum}.txt`, pageContent);
    
    // Generate illustration
    const imagePrompt = generateImagePromptFromPage(pageContent);
    const imageResult = await generateDalleImages({ prompt: imagePrompt, size: "1024x1024" });
    
    // Download the illustration
    await downloadImage(imageResult.url, `${storyDir}/page${pageNum}.png`);
    
    // Create audio narration
    await textToSpeech({
      text: pageContent,
      voice: "ashley_moore",
      output: `${storyDir}/page${pageNum}.mp3`
    });
  }
  
  return {
    title: storyTitle,
    directory: storyDir,
    pageCount: storyPages.length
  };
}

// Helper functions
function isInappropriateForChildren(text) {
  // Implement logic to check if content is appropriate
  return false;
}

function generateTitleFromStory(story) {
  // Logic to generate a title
  return "Adventure Story";
}

function isPromptNotFullStory(text) {
  // Logic to determine if the text is a prompt or full story
  return text.split(' ').length < 50;
}

function splitIntoPages(story, pageCount) {
  // Logic to split the story into pages
  const words = story.split(' ');
  const wordsPerPage = Math.ceil(words.length / pageCount);
  const pages = [];
  
  for (let i = 0; i < pageCount; i++) {
    const startIndex = i * wordsPerPage;
    const endIndex = Math.min(startIndex + wordsPerPage, words.length);
    pages.push(words.slice(startIndex, endIndex).join(' '));
  }
  
  return pages;
}

function generateImagePromptFromPage(pageContent) {
  // Logic to create DALL-E prompt from page content
  return `Illustration for children's book: ${pageContent.substring(0, 100)}`;
}

async function downloadImage(url, destination) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destination, Buffer.from(arrayBuffer));
}
