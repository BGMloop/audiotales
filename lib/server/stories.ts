import fs from "fs";
import path from "path";
import { Story, Page } from "@/types/stories";
import cleanTitle from "@/lib/cleanTitle";

const storiesDirectory = path.join(process.cwd(), "public/stories");

function logDebug(message: string, data?: any) {
  console.log(`[Debug] ${message}`, data || '');
}

function logError(message: string, error: any) {
  console.error(`[Error] ${message}:`, error);
}

export function getAllStoriesFromFS(): Story[] {
  logDebug('Getting all stories from directory:', storiesDirectory);
  
  if (!fs.existsSync(storiesDirectory)) {
    logDebug('Stories directory does not exist');
    return [];
  }

  try {
    const storyFolders = fs.readdirSync(storiesDirectory);
    logDebug('Found story folders:', storyFolders);

    const stories: Story[] = storyFolders
      .filter(folder => {
        const folderPath = path.join(storiesDirectory, folder);
        return fs.statSync(folderPath).isDirectory();
      })
      .map((storyFolder) => {
        const storyPath = path.join(storiesDirectory, storyFolder);
        logDebug('Processing story folder:', storyFolder);

        try {
          const files = fs.readdirSync(storyPath);
          logDebug('Found files in story folder:', files);

          // Group files by page number
          const pages: Page[] = [];
          const pageMap = new Map<string, Partial<Page>>();

          files.forEach((file) => {
            const match = file.match(/page(\d+)\.(txt|png)$/);
            if (!match) return;

            const [, pageNum, ext] = match;
            if (!pageMap.has(pageNum)) {
              pageMap.set(pageNum, {});
            }

            const page = pageMap.get(pageNum)!;
            const filePath = path.join(storyPath, file);

            if (ext === 'txt') {
              page.txt = fs.readFileSync(filePath, 'utf-8');
            } else if (ext === 'png') {
              page.png = `/stories/${storyFolder}/${file}`;
            }
          });

          // Convert map to array and sort by page number
          for (const [pageNum, page] of pageMap.entries()) {
            if (page.txt && page.png) {
              pages.push({
                txt: page.txt,
                png: page.png
              });
            } else {
              logDebug(`Skipping incomplete page ${pageNum} in ${storyFolder}`, {
                hasTxt: !!page.txt,
                hasPng: !!page.png
              });
            }
          }

          pages.sort((a, b) => {
            const aNum = parseInt(a.png?.match(/page(\d+)/)?.[1] || '0');
            const bNum = parseInt(b.png?.match(/page(\d+)/)?.[1] || '0');
            return aNum - bNum;
          });

          if (pages.length === 0) {
            logDebug(`No valid pages found in story: ${storyFolder}`);
          } else {
            logDebug(`Successfully processed story: ${storyFolder}`, {
              pageCount: pages.length
            });
          }

          return {
            story: cleanTitle(storyFolder),
            pages: pages,
          };
        } catch (error) {
          logError(`Error processing story folder: ${storyFolder}`, error);
          return null;
        }
      })
      .filter((story): story is Story => {
        if (!story) return false;
        if (story.pages.length === 0) {
          logDebug(`Filtering out story with no pages: ${story.story}`);
          return false;
        }
        return true;
      });

    logDebug('Successfully processed all stories', {
      totalStories: stories.length
    });
    return stories;
  } catch (error) {
    logError('Error reading stories directory', error);
    return [];
  }
}

export function getStoryFromFS(storyTitle: string): Story | null {
  const stories = getAllStoriesFromFS();
  return stories.find((s) => s.story === storyTitle) || null;
} 