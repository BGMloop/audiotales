"use client";

import { notFound, useRouter } from "next/navigation";
import Story from "@/components/Story";
import { getStory } from "@/lib/stories";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Story as StoryType } from "@/types/stories";

interface StoryClientPageProps {
  storyId: string;
}

export default function StoryClientPage({ storyId }: StoryClientPageProps) {
  const router = useRouter();
  const [story, setStory] = useState<StoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const loadStory = async () => {
      setIsLoading(true);
      try {
        const storyData = await getStory(storyId);
        if (!storyData) {
          setIsError(true);
          return;
        }
        setStory(storyData);
      } catch (error) {
        console.error("Failed to load story:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <span className="ml-2 text-lg">Loading story...</span>
      </div>
    );
  }

  if (isError || !story) {
    return notFound();
  }

  return <Story story={story} />;
} 