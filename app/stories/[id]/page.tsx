import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import StoryClientPage from "./client";

interface Props {
  params: { id: string };
}

// Helper function to safely decode story name
function decodeStoryName(name: string): string {
  try {
    return decodeURIComponent(name);
  } catch (error) {
    console.error('[Debug] Error decoding story name:', error);
    throw error;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const storyName = decodeStoryName(params.id);
    
    return {
      title: `Story: ${storyName}`,
      description: `Read the story: ${storyName}`,
      openGraph: {
        title: `Story: ${storyName}`,
        description: `Read the story: ${storyName}`,
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: `Story: ${storyName}`,
        description: `Read the story: ${storyName}`,
      },
    };
  } catch (error) {
    console.error('[Debug] Error generating metadata:', error);
    return {
      title: 'Error Loading Story',
      description: 'There was an error loading the story metadata',
    };
  }
}

export default function StoryPage({ params }: Props) {
  if (!params?.id) {
    return notFound();
  }
  
  try {
    // We use the id param as the story name
    const storyName = decodeStoryName(params.id);
    return <StoryClientPage storyId={storyName} />;
  } catch (error) {
    console.error('[Debug] Error rendering StoryPage:', error);
    // Use a direct component instead of notFound() to avoid template variable issues
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-3xl font-bold mb-4">Story Not Found</h2>
        <p className="mb-6">Sorry, we couldn't find the specific story you're looking for.</p>
      </div>
    );
  }
}
