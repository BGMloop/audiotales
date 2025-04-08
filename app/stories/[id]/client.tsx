"use client";

import { notFound, useRouter } from "next/navigation";
import Story from "@/components/Story";
import { getStory } from "@/lib/stories";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { Story as StoryType } from "@/types/stories";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StoryClientPageProps {
  storyId: string;
}

export default function StoryClientPage({ storyId }: StoryClientPageProps) {
  const router = useRouter();
  const [story, setStory] = useState<StoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setError("Story ID is required");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const storyData = await getStory(storyId);
        if (!storyData) {
          setError("Story not found");
          return;
        }
        setStory(storyData);
      } catch (error) {
        console.error("Failed to load story:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load story";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <span className="ml-2 text-lg">Loading story...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="flex items-center text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <p className="text-lg font-semibold">{error}</p>
        </div>
        <Button 
          onClick={handleRetry} 
          className="flex items-center space-x-2"
          variant="outline"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
        <Button 
          onClick={() => router.push('/stories')} 
          className="flex items-center space-x-2"
          variant="ghost"
        >
          <span>Back to Stories</span>
        </Button>
      </div>
    );
  }

  if (!story) {
    return notFound();
  }

  return <Story story={story} />;
} 