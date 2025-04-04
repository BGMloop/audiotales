"use client";

import { getAllStories } from "@/lib/stories";
import { Story } from "@/types/stories";
import { BookIcon, BookOpen, Download, Loader2, RefreshCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { exportMultipleStories } from "@/lib/exportStory";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function StoriesClient() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storiesData = await getAllStories();
      setStories(storiesData);
    } catch (err) {
      console.error("Failed to fetch stories:", err);
      setError("Failed to load stories. Please try again.");
      toast.error("Failed to load stories. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleBulkExport = async () => {
    if (stories.length === 0) {
      toast.error("No stories to export");
      return;
    }

    try {
      setIsExporting(true);
      toast.info(`Preparing to export ${stories.length} stories. This may take a moment...`);
      await exportMultipleStories(stories);
      toast.success(`Successfully exported ${stories.length} stories!`);
    } catch (error) {
      console.error("Failed to export stories:", error);
      toast.error("Failed to export stories. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-2 text-lg">Loading stories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 flex flex-col justify-center items-center min-h-[50vh]">
        <div className="text-red-500 mb-4">{error}</div>
        <Button 
          onClick={fetchStories}
          className="flex items-center gap-2"
        >
          <RefreshCcw size={16} />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Story Library</h1>
        {stories.length > 0 && (
          <Button 
            onClick={handleBulkExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export All Stories
              </>
            )}
          </Button>
        )}
      </div>

      {stories.length === 0 && (
        <div className="text-center py-20">
          <BookIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">No stories found.</p>
          <p className="text-gray-400 mt-2">Create your first story to get started!</p>
          <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
            <Link href="/">Create a Story</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {stories.map((story) => (
          <Link
            href={`/stories/${encodeURIComponent(story.story)}`}
            key={story.story}
            className="border rounded-lg cursor-pointer hover:shadow-lg hover:border-purple-500 transition-all duration-300 ease-in-out"
          >
            <div className="relative">
              <p className="absolute flex items-center top-0 right-0 bg-white text-purple-500 font-bold p-3 rounded-lg m-2 text-sm">
                <BookOpen className="w-4 h-4 mr-1" />
                {story.pages.length === 1
                  ? `${story.pages.length} Page`
                  : `${story.pages.length} Pages`}
              </p>
              <Image
                src={story.pages[0].png}
                alt={story.story}
                width={500}
                height={500}
                className="w-full object-contain rounded-t-lg"
              />
            </div>
            <h2 className="text-lg p-5 first-letter:text-3xl font-light text-center">
              {story.story}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
} 