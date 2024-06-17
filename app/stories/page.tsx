import { getAllStories } from "@/lib/stories";
import { Story } from "@/types/stories";
import Link from "next/link";

function Stories() {
  const stories: Story[] = getAllStories();

  return (
    <div>
      {stories.length === 0 && <p>No stories found.</p>}

      {stories.map((story) => (
        <Link href={`/stories/${story.story}`} key={story.story}>
          <h2>
            {story.story} ({story.pages.length} pages)
          </h2>
        </Link>
      ))}
    </div>
  );
}

export default Stories;
