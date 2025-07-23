"use client";

import { getAllStories } from "@/lib/server/stories";
import { Story } from "@/types/stories";
import { BookIcon, BookOpen, Download, Loader2, RefreshCcw, AlertTriangle, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { exportMultipleStories } from "@/lib/exportStory";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define a placeholder image URL
const PLACEHOLDER_IMAGE_URL = "/placeholder-story.png"; // Ensure this exists in public folder

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
    } catch (err: unknown) {
      console.error("Failed to fetch stories:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to load stories. ${message}`);
      toast.error("Failed to load stories", {
        description: "Please try refreshing the page or check back later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleBulkExport = async () => {
    if (stories.length === 0) {
      toast.info("No stories available to export.");
      return;
    }

    setIsExporting(true);
    toast.info(`Preparing to export ${stories.length} stories. This may take a moment...`);
    try {
      await exportMultipleStories(stories);
      toast.success(`Successfully exported ${stories.length} stories!`);
    } catch (error: unknown) {
      console.error("Failed to export stories:", error);
      const message = error instanceof Error ? error.message : "Please try again later.";
      toast.error("Failed to export stories", {
        description: message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <span className="text-lg">Loading your amazing stories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={fetchStories} variant="outline">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-16 min-h-[60vh] flex flex-col justify-center items-center">
        <BookIcon className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold text-foreground">Your Story Library is Empty</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">Ready to weave some magic? Create your first story to see it appear here!</p>
        <Button asChild className="mt-6">
          <Link href="/">Start Creating</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground">Your Story Library</h1>
        <Button
          onClick={handleBulkExport}
          disabled={isExporting}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={18} className="mr-2" />
              Export All ({stories.length})
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {stories.map((story) => {
          const imageUrl = story.pages?.[0]?.png || PLACEHOLDER_IMAGE_URL;
          const imageAltText = story.pages?.[0]?.png
            ? `Cover image for story: ${story.story}`
            : "Placeholder image - no cover generated yet";

          return (
            <Card
              key={story.story}
              className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            >
              <Link
                href={`/stories/${encodeURIComponent(story.story)}`}
                aria-label={`View story: ${story.story}`}
              >
                <CardHeader className="p-0 relative">
                  <div className="aspect-square w-full bg-muted flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt={imageAltText}
                      width={400}
                      height={400}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE_URL;
                        (e.target as HTMLImageElement).alt = "Error loading image";
                      }}
                    />
                  </div>
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {story.pages.length} Page{story.pages.length !== 1 ? 's' : ''}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold line-clamp-2 h-[3.2em]">
                    {story.story}
                  </CardTitle>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 