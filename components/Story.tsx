"use client";

import { useState } from "react";
import { Story as StoryType } from "../types/stories";
import Image from "next/image";
import Link from "next/link";

interface Props {
  story: StoryType;
}

const Story = ({ story }: Props) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleNextPage = () => {
    if (currentPageIndex < story.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  console.log(story);

  return (
    <div>
      <h2>{story.story}</h2>

      <p>{story.pages[currentPageIndex].txt}</p>

      <Image
        src={story.pages[currentPageIndex].png}
        alt={`Page ${currentPageIndex + 1}`}
        width={500}
        height={500}
      />

      <div>
        <button onClick={handlePreviousPage} disabled={currentPageIndex === 0}>
          Previous
        </button>
        <Link href="/stories">Back to Stories</Link>
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex === story.pages.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Story;
