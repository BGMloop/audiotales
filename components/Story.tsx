"use client";

import { useEffect, useState, useRef } from "react";
import { Story as StoryType } from "../types/stories";
import Image from "next/image";
import { PlayCircle, PauseCircle, Volume2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "./ui/button";

interface Props {
  story: StoryType;
}

const Story = ({ story }: Props) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrent(newIndex + 1);
      
      // Stop current audio when changing slides
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      // Load the new audio file
      if (story.pages[newIndex]?.mp3) {
        audioRef.current = new Audio(story.pages[newIndex].mp3);
      }
    });

    // Initialize audio for the first page
    if (story.pages[0]?.mp3) {
      audioRef.current = new Audio(story.pages[0].mp3);
    }
  }, [api, story.pages]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="">
      <div className="px-20">
        <Carousel setApi={setApi} className="w-full lg:w-4/5 h-56 mx-auto">
          <CarouselContent className="px-5">
            {story.pages.map((page, i) => (
              <CarouselItem key={i}>
                <Card className="p-5 md:p-10 border">
                  <h2 className="text-center text-gray-400">{story.story}</h2>

                  <CardContent className="p-5 xl:flex">
                    <div className="flex flex-col">
                      <p className="font-semibold text-xl first-letter:text-3xl whitespace-pre-wrap">
                        {page.txt}
                      </p>
                      
                      {page.mp3 && (
                        <div className="flex items-center mt-4 space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={togglePlayPause}
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                          >
                            {current === i+1 && isPlaying ? (
                              <PauseCircle size={32} />
                            ) : (
                              <PlayCircle size={32} />
                            )}
                          </Button>
                          <Volume2 className="text-purple-600" />
                          <span className="text-sm text-gray-500">Listen to narration</span>
                        </div>
                      )}
                    </div>
                    
                    <Image
                      src={page.png}
                      alt={`Page ${i + 1}`}
                      width={500}
                      height={500}
                      className="w-80 h-8w-80 xl:w-[500px] xl:h-[500px] rounded-3xl mx-auto float-right p-5 xl:order-last"
                    />
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
