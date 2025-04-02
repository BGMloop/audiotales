import { notFound } from "next/navigation";
import Story from "@/components/Story";
import { Story as StoryType } from "@/types/stories";
import StoryClientPage from "./client";

interface StoryPageProps {
  params: {
    id: string;
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = params;

  // The ID is URL encoded, so we need to decode it before using it to get the story
  const decodedId = decodeURIComponent(id);

  // We're just passing the ID to the client component which will fetch the data
  return <StoryClientPage storyId={decodedId} />;
}
