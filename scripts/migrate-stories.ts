import fs from 'fs';
import path from 'path';
import { Story, StoryMetadata } from '@/types/stories';

const storiesDirectory = path.join(process.cwd(), 'public/stories');

async function migrateStories() {
  if (!fs.existsSync(storiesDirectory)) {
    console.error('Stories directory not found!');
    return;
  }

  const storyFolders = fs.readdirSync(storiesDirectory);
  
  for (const storyFolder of storyFolders) {
    const storyPath = path.join(storiesDirectory, storyFolder);
    const metadataPath = path.join(storyPath, 'metadata.json');
    
    // Skip if metadata.json already exists
    if (fs.existsSync(metadataPath)) {
      console.log(`Skipping ${storyFolder} - metadata.json already exists`);
      continue;
    }

    console.log(`Migrating ${storyFolder}...`);

    // Create basic metadata
    const metadata: StoryMetadata = {
      title: storyFolder.replace(/-/g, ' '),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Write metadata file
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2)
    );

    // Create a placeholder for missing audio files
    const files = fs.readdirSync(storyPath);
    const textFiles = files.filter(f => f.endsWith('.txt'));
    
    for (const textFile of textFiles) {
      const pageNum = textFile.match(/page(\d+)\.txt/)?.[1];
      if (!pageNum) continue;

      const audioFile = `page${pageNum}.mp3`;
      const audioPath = path.join(storyPath, audioFile);
      
      if (!fs.existsSync(audioPath)) {
        console.log(`Missing audio file for ${storyFolder}/${textFile}`);
        // You can add placeholder audio file creation here if needed
      }
    }

    console.log(`Successfully migrated ${storyFolder}`);
  }
}

// Run the migration
migrateStories().catch(console.error); 