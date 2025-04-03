import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { Story, Page } from "@/types/stories";
import cleanTitle from "@/lib/cleanTitle";

const storiesDirectory = path.join(process.cwd(), "public/stories");

function getStory(storyTitle: string): Story | null {
  if (!fs.existsSync(storiesDirectory)) {
    return null;
  }

  const storyFolders = fs.readdirSync(storiesDirectory);
  
  for (const storyFolder of storyFolders) {
    const title = cleanTitle(storyFolder);
    
    if (title === storyTitle) {
      const storyPath = path.join(storiesDirectory, storyFolder);
      const files = fs.readdirSync(storyPath);

      // Group files by page number
      const pages: Page[] = [];
      const pageMap: { [key: string]: Partial<Page> } = {};

      files.forEach((file) => {
        const filePath = path.join(storyPath, file);
        const type = path.extname(file).substring(1);
        const pageNumber = file.match(/page(\d+)\./)?.[1];

        if (pageNumber) {
          if (!pageMap[pageNumber]) {
            pageMap[pageNumber] = {};
          }

          if (type === "txt") {
            pageMap[pageNumber].txt = fs.readFileSync(filePath, "utf-8");
          } else if (type === "png") {
            pageMap[pageNumber].png = `/stories/${storyFolder}/${file}`;
          }
        }
      });

      Object.keys(pageMap).forEach((pageNumber) => {
        if (pageMap[pageNumber].txt && pageMap[pageNumber].png) {
          pages.push(pageMap[pageNumber] as Page);
        }
      });

      if (pages.length > 0) {
        return {
          story: title,
          pages: pages,
        };
      }
    }
  }
  
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: { title: string } }
) {
  try {
    const story = getStory(params.title);
    
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    
    return NextResponse.json(story);
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 });
  }
} 