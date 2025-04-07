export interface Page {
  txt: string;
  png: string;
  mp3?: string;  // Optional property for audio narration
}

export interface StoryMetadata {
  title: string;
  author?: string;
  description?: string;
  ageRange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  story: string;
  pages: Page[];
  metadata?: StoryMetadata;
}
