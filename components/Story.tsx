"use client";

import { useEffect, useState } from "react";
import { Story as StoryType } from "../types/stories";
import Image from "next/image";
import { Download, FileText, Share, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { exportStoryAsZip, exportStoryAsPDF, shareStory } from "@/lib/exportStory";
import { Howl } from 'howler';

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
  { id: 'ashley', name: 'Ashley (Default)' },
  { id: 'nova', name: 'Nova' },
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'shimmer', name: 'Shimmer' },
  { id: 'ballad', name: 'Ballad' },
  { id: 'coral', name: 'Coral' },
  { id: 'sage', name: 'Sage' },
  { id: 'ash', name: 'Ash' },
  { id: 'verse', name: 'Verse' }
];

interface Props {
  story: StoryType;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const Story = ({ story }: Props) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [speed, setSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSound, setCurrentSound] = useState<Howl | null>(null);

  // Early return with more descriptive error message
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

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      const current = api.selectedScrollSnap() + 1;
      setCurrent(current);
      stopCurrentSound();
    });
  }, [api]);

  const stopCurrentSound = () => {
    if (currentSound) {
      currentSound.stop();
      setCurrentSound(null);
      setIsPlaying(false);
    }
  };

  const playPage = async (text: string) => {
    try {
      setIsLoading(true);
      stopCurrentSound();

      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          voice: selectedVoice,
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

      // Convert base64 to blob URL
      const audioBlob = new Blob(
        [base64ToArrayBuffer(data.audioData)],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      const sound = new Howl({
        src: [audioUrl],
        format: ['mp3'],
        html5: true,
        onend: () => {
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          setCurrentSound(null);
          if (current < count - 1) {
            api?.scrollNext();
          }
        },
        onloaderror: () => {
          console.error('Failed to load audio');
          URL.revokeObjectURL(audioUrl);
          setIsLoading(false);
          setIsPlaying(false);
          toast.error('Failed to load audio. Please try again.');
        },
        onplayerror: () => {
          console.error('Failed to play audio');
          URL.revokeObjectURL(audioUrl);
          setIsLoading(false);
          setIsPlaying(false);
          toast.error('Failed to play audio. Please try again.');
        },
        onload: () => {
          setIsLoading(false);
          sound.play();
          setIsPlaying(true);
        },
      });

      setCurrentSound(sound);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      setIsPlaying(false);
      toast.error(error instanceof Error ? error.message : 'Failed to play audio. Please try again.');
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopCurrentSound();
    } else {
      const currentPage = story.pages[current - 1];
      playPage(currentPage.txt);
    }
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
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-5">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{story.story}</h1>
          
          <div className="flex items-center space-x-4">
            {/* Voice Selection and Play Button */}
            <div className="flex items-center space-x-2">
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
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
