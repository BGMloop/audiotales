export interface Page {
    txt: string;
    png: string;
    mp3: string; // Optional mp3 file path for audio narration
  }
  
  export interface Story {
    story: string;
    pages: Page[];
  }
  