import { notFound } from "next/navigation";
import Story from "@/components/Story";
import { getAllStories, getStory } from "@/lib/stories";

interface StoryPageProps {
  params: {
    id: string;
  };
}

export default function StoryPage({ params }: StoryPageProps) {
  const { id } = params;

  // Explanation: The id is URL encoded, so we need to decode it before using it to get the story. This fixes the issue where the story is not found when the id contains special characters such as %20 for spaces.
  const decodedId = decodeURIComponent(id);

  const story = getStory(decodedId);

  if (!story) {
    return notFound();
  }

  return <Story story={story} />;
}

export async function generateStaticParams() {
  const stories = getAllStories();

  const paths = stories.map((story) => ({
    id: story.story,
  }));

  return paths;
}
