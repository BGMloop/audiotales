"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Story as StoryType } from "../types/stories";
import Image from "next/image";
import { Download, FileText, Share, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { exportStoryAsZip, exportStoryAsPDF, shareStory } from "@/lib/exportStory";
import { useAudio } from "@/lib/AudioContext";
import type { EmblaCarouselType } from 'embla-carousel';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Available voices
const VOICES = [
  { id: 'nova', name: 'Nova (Default)(Female)' },
  { id: 'ash', name: 'Ash (Default)(Male)' },
  { id: 'sage', name: 'Sage (Default2)(Female)' },
  { id: 'onyx', name: 'Onyx (Default2)(Male)' },
  { id: 'alloy', name: 'Alloy (Male)' },
  { id: 'echo', name: 'Echo (Male)' },
  { id: 'fable', name: 'Fable (Female)' },
  { id: 'shimmer', name: 'Shimmer (Female)' },
  { id: 'coral', name: 'Coral (Female)' }
];

interface Props {
  story: StoryType;
}

const Story = ({ story }: Props) => {
  const [api, setApi] = useState<EmblaCarouselType | null>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const transitioningRef = useRef(false);
  const { 
    currentVoice, 
    setCurrentVoice, 
    playAudio, 
    stopAudio, 
    isPlaying,
    onAudioComplete,
    pauseAudio
  } = useAudio();

  // Early return checks
  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-red-500">Error: Story data is missing</p>
      </div>
    );
  }

  if (!Array.isArray(story.pages) || story.pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-red-500">Error: Story has no pages or invalid page data</p>
      </div>
    );
  }

  // Define functions first
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

  const playCurrentPage = useCallback(async () => {
    if (!api || !story.pages || story.pages.length === 0) return;
    
    const currentIndex = api.selectedScrollSnap();
    const pageNumber = currentIndex + 1; // Convert to 1-based page number
    const currentPage = story.pages[currentIndex];
    
    if (!currentPage?.txt) return;

    try {
      setIsLoading(true);
      const pageId = `${story.story}-page-${currentIndex}`;
      
      // Add page number announcement for all pages except the first
      const textToSpeak = pageNumber === 1
        ? currentPage.txt 
        : `Page ${pageNumber}. ${currentPage.txt}`;
      
      console.log(`Playing page ${pageNumber} with${pageNumber === 1 ? 'out' : ''} announcement`);
      
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSpeak,
          voice: currentVoice,
          speed: speed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const data = await response.json();
      if (!data.success || !data.audioData) {
        throw new Error('Failed to get audio data');
      }

      await playAudio(data.audioData, pageId);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to play audio. Please try again.');
      await stopAudio();
    } finally {
      setIsLoading(false);
    }
  }, [api, story.pages, story.story, currentVoice, speed, playAudio, stopAudio]);

  const onNext = useCallback(async () => {
    if (!api || !story.pages) return;
    const nextIndex = api.selectedScrollSnap() + 1;
    if (nextIndex < story.pages.length) {
      transitioningRef.current = true;
      stopAudio();
      api.scrollTo(nextIndex);
      transitioningRef.current = true;
    } else {
      await stopAudio();
    }
  }, [api, story.pages, stopAudio]);

  const onPrev = useCallback(async () => {
    if (!api || !story.pages) return;
    const prevIndex = api.selectedScrollSnap() - 1;
    if (prevIndex >= 0) {
      transitioningRef.current = true;
      await stopAudio();
      api.scrollTo(prevIndex);
    }
  }, [api, story.pages, stopAudio]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pauseAudio();
    } else {
      transitioningRef.current = false;
      await playCurrentPage();
    }
  }, [isPlaying, pauseAudio, playCurrentPage]);

  const handleVoiceChange = useCallback(async (value: string) => {
    setCurrentVoice(value);
    if (isPlaying) {
      await stopAudio();
      setTimeout(() => {
        playCurrentPage();
      }, 100);
    }
  }, [isPlaying, stopAudio, playCurrentPage, setCurrentVoice]);

  // Effects after all function definitions
  useEffect(() => {
    if (!api) return;
    
    setCount(api.scrollSnapList().length);
    const newCurrent = api.selectedScrollSnap() + 1;
    setCurrent(newCurrent);

    const handleScroll = () => {
      const newIndex = api.selectedScrollSnap() + 1;
      setCurrent(newIndex);
    };

    const handleSettle = () => {
      if (isPlaying) {
        playCurrentPage();
      }
      transitioningRef.current = false;
    };

    api.on('select', handleScroll);
    api.on('settle', handleSettle);
    
    return () => {
      api.off('select', handleScroll);
      api.off('settle', handleSettle);
    };
  }, [api, isPlaying, playCurrentPage]);

  useEffect(() => {
    const cleanup = async () => {
      await stopAudio();
    };
    return () => {
      cleanup();
    };
  }, [stopAudio]);

  useEffect(() => {
    if (!onAudioComplete) return;
    
    const handleAudioComplete = () => {
      const currentIndex = api?.selectedScrollSnap() ?? 0;
      if (currentIndex < (story.pages?.length ?? 0) - 1) {
        // Continue playing state flag
        const wasPlaying = isPlaying;
        
        // When narration completes, advance to next page
        onNext();
        
        // Make sure we're still in a playing state for the next page
        if (!wasPlaying) {
          setTimeout(() => {
            playCurrentPage();
          }, 300); // Give a little time for the carousel to settle
        }
      } else {
        // At the last page, stop playing
        stopAudio();
      }
    };
    
    onAudioComplete(handleAudioComplete);
    
    // No need to return cleanup as onAudioComplete handles this
  }, [onAudioComplete, onNext, api, story.pages, stopAudio, isPlaying, playCurrentPage]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-5">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{story.story}</h1>
          
          <div className="flex items-center space-x-4">
            {/* Voice Selection and Play Button */}
            <div className="flex items-center space-x-2">
              <Select
                value={currentVoice}
                onValueChange={handleVoiceChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm">Speed: {speed}x</span>
                <Slider
                  value={[speed]}
                  onValueChange={(values: number[]) => setSpeed(values[0])}
                  min={0.25}
                  max={4.0}
                  step={0.25}
                  className="w-[100px]"
                />
              </div>

              <Button
                onClick={togglePlayPause}
                disabled={isLoading}
                className={`flex items-center gap-2 ${
                  isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
              </Button>
            </div>

            {/* Export and Share Buttons */}
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
          </div>
        </div>

        {/* Display metadata if available */}
        {story.metadata && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">About this story</h2>
            <div className="grid grid-cols-2 gap-4">
              {story.metadata.author && (
                <p><span className="font-medium">Author:</span> {story.metadata.author}</p>
              )}
              {story.metadata.ageRange && (
                <p><span className="font-medium">Age Range:</span> {story.metadata.ageRange}</p>
              )}
              {story.metadata.description && (
                <p className="col-span-2"><span className="font-medium">Description:</span> {story.metadata.description}</p>
              )}
            </div>
          </div>
        )}

        <Carousel 
          setApi={(newApi) => {
            if (newApi) setApi(newApi);
          }} 
          className="w-full lg:w-4/5 h-56 mx-auto"
        >
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
