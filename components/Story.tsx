"use client";

import { useEffect, useState, useRef } from "react";
import { Story as StoryType } from "../types/stories";
import Image from "next/image";
import { Download, FileText, Share, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { exportStoryAsZip, exportStoryAsPDF, shareStory } from "@/lib/exportStory";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  story: StoryType;
}

const Story = ({ story }: Props) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      const newPage = api.selectedScrollSnap() + 1;
      setCurrent(newPage);
      
      // Stop current audio and load new page's audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = story.pages[newPage - 1].mp3;
        setIsPlaying(false);
      }
    });
  }, [api, story.pages]);

  useEffect(() => {
    // Initialize audio for the first page
    if (story.pages[0]?.mp3) {
      audioRef.current = new Audio(story.pages[0].mp3);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [story.pages]);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportStoryAsZip(story);
      toast.success("Story exported as ZIP successfully!");
    } catch (error) {
      console.error("Failed to export story:", error);
      toast.error("Failed to export story. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.info("Preparing PDF export. This may take a moment...");
      await exportStoryAsPDF(story);
      toast.success("Story exported as PDF successfully!");
    } catch (error) {
      console.error("Failed to export story as PDF:", error);
      toast.error("Failed to export story as PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const shared = await shareStory(story);
      if (!shared) {
        toast.error("Sharing is not supported on this device/browser.");
      }
    } catch (error) {
      console.error("Failed to share story:", error);
      toast.error("Failed to share story. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center gap-4 mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                disabled={isExporting || isExportingPDF}
              >
                {isExporting || isExportingPDF ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download as ZIP</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} disabled={isExportingPDF}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Download as PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Share size={16} />
            {isSharing ? "Sharing..." : "Share Story"}
          </Button>

          <Button
            onClick={toggleAudio}
            className={`flex items-center gap-2 ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause Narration' : 'Play Narration'}
          </Button>
        </div>

        <Carousel setApi={setApi} className="w-full lg:w-4/5 h-56 mx-auto">
          <CarouselContent className="px-5">
            {story.pages.map((page, i) => (
              <CarouselItem key={i}>
                <Card className="p-5 md:p-10 border">
                  <h2 className="text-center text-gray-400">{story.story}</h2>

                  <CardContent className="p-5 xl:flex">
                    <Image
                      src={page.png}
                      alt={`Page ${i + 1}`}
                      width={500}
                      height={500}
                      className="w-80 h-8w-80 xl:w-[500px] xl:h-[500px] rounded-3xl mx-auto float-right p-5 xl:order-last"
                      loading={i === 0 ? "eager" : "lazy"}
                      priority={i === 0}
                    />
                    <p className="font-semibold text-xl first-letter:text-3xl whitespace-pre-wrap">
                      {page.txt}
                    </p>
                  </CardContent>

                  <p className="text-center text-gray-400">
                    Page {current} of {count}
                  </p>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default Story;
