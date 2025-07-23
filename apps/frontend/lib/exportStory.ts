import { Story } from '@/types/stories';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/**
 * Exports a story as a ZIP file containing story text and images
 */
export async function exportStoryAsZip(story: Story): Promise<void> {
  const zip = new JSZip();
  
  // Create a folder for the story
  const storyFolder = zip.folder(story.story.replace(/\s+/g, '-'));
  if (!storyFolder) return;
  
  // Add a metadata file with story information
  storyFolder.file('metadata.json', JSON.stringify(story, null, 2));
  
  // Create a text file with the full story
  const fullText = story.pages.map((page, index) => {
    return `--- Page ${index + 1} ---\n\n${page.txt}\n\n`;
  }).join('\n');
  
  storyFolder.file('story.txt', fullText);
  
  // Add all images and audio files
  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];
    
    // For images
    try {
      const imgResponse = await fetch(page.png);
      const imgBlob = await imgResponse.blob();
      storyFolder.file(`page${i + 1}.png`, imgBlob);
    } catch (error) {
      console.error(`Failed to export image for page ${i + 1}:`, error);
    }

    // For audio files
    if (page.mp3) {
      try {
        const audioResponse = await fetch(page.mp3);
        const audioBlob = await audioResponse.blob();
        storyFolder.file(`page${i + 1}.mp3`, audioBlob);
      } catch (error) {
        console.error(`Failed to export audio for page ${i + 1}:`, error);
      }
    }
  }
  
  // Generate and save the ZIP file
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${story.story.replace(/\s+/g, '-')}.zip`);
}

/**
 * Exports a story as a PDF file
 */
export async function exportStoryAsPDF(story: Story): Promise<void> {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
  });
  
  // Add title page
  pdf.setFontSize(24);
  pdf.text(story.story, pdf.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  // Add subtitle
  pdf.setFontSize(12);
  pdf.text('A children\'s story created with AudioTales AI', pdf.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
  
  // Try to add the first image as cover if available
  if (story.pages.length > 0) {
    try {
      const imgResponse = await fetch(story.pages[0].png);
      const imgBlob = await imgResponse.blob();
      const imgUrl = URL.createObjectURL(imgBlob);
      
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = imgUrl;
      });
      
      // Calculate image dimensions to fit the page while maintaining aspect ratio
      const pageWidth = pdf.internal.pageSize.getWidth() - 40; // margins
      const pageHeight = pdf.internal.pageSize.getHeight() - 90; // margins + title space
      
      const imgRatio = img.width / img.height;
      let imgWidth = pageWidth;
      let imgHeight = imgWidth / imgRatio;
      
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = imgHeight * imgRatio;
      }
      
      // Add the image
      pdf.addImage(
        img, 
        'PNG', 
        (pdf.internal.pageSize.getWidth() - imgWidth) / 2, 
        60, 
        imgWidth, 
        imgHeight
      );
      
      // Clean up
      URL.revokeObjectURL(imgUrl);
    } catch (error) {
      console.error('Failed to add cover image:', error);
    }
  }
  
  // Process each page of the story
  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];
    
    // Add a new page for each story page
    pdf.addPage();
    
    // Add page number
    pdf.setFontSize(10);
    pdf.text(`Page ${i + 1}`, pdf.internal.pageSize.getWidth() - 20, 10);
    
    // Add page text
    pdf.setFontSize(12);
    
    // Split text into lines to fit the page width
    const textLines = pdf.splitTextToSize(
      page.txt, 
      pdf.internal.pageSize.getWidth() - 40
    );
    
    pdf.text(textLines, 20, 20);
    
    // Try to add the page's image
    try {
      const imgResponse = await fetch(page.png);
      const imgBlob = await imgResponse.blob();
      const imgUrl = URL.createObjectURL(imgBlob);
      
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = imgUrl;
      });
      
      // Calculate available space for image
      const textHeight = textLines.length * 5; // Approximate text height
      const availableHeight = pdf.internal.pageSize.getHeight() - 20 - textHeight - 30;
      
      // Calculate image dimensions
      const pageWidth = pdf.internal.pageSize.getWidth() - 40;
      const imgRatio = img.width / img.height;
      let imgWidth = pageWidth;
      let imgHeight = imgWidth / imgRatio;
      
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * imgRatio;
      }
      
      // Add the image below the text
      pdf.addImage(
        img, 
        'PNG', 
        (pdf.internal.pageSize.getWidth() - imgWidth) / 2, 
        30 + textHeight, 
        imgWidth, 
        imgHeight
      );
      
      // Clean up
      URL.revokeObjectURL(imgUrl);
    } catch (error) {
      console.error(`Failed to add image for page ${i + 1}:`, error);
    }
  }
  
  // Save the PDF
  pdf.save(`${story.story.replace(/\s+/g, '-')}.pdf`);
}

/**
 * Exports multiple stories as a single ZIP file
 */
export async function exportMultipleStories(stories: Story[]): Promise<void> {
  if (stories.length === 0) return;
  
  const zip = new JSZip();
  
  // Create a folder for all stories
  const storiesFolder = zip.folder('AudioTales-Collection');
  if (!storiesFolder) return;
  
  // Add an index file with all story titles
  const indexText = stories.map((story, index) => {
    return `${index + 1}. ${story.story} (${story.pages.length} pages)`;
  }).join('\n');
  
  storiesFolder.file('stories-index.txt', indexText);
  
  // Process each story
  for (const story of stories) {
    const storyFolder = storiesFolder.folder(story.story.replace(/\s+/g, '-'));
    if (!storyFolder) continue;
    
    // Add a metadata file with story information
    storyFolder.file('metadata.json', JSON.stringify(story, null, 2));
    
    // Create a text file with the full story
    const fullText = story.pages.map((page, index) => {
      return `--- Page ${index + 1} ---\n\n${page.txt}\n\n`;
    }).join('\n');
    
    storyFolder.file('story.txt', fullText);
    
    // Add all images and audio files
    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      
      // For images
      try {
        const imgResponse = await fetch(page.png);
        const imgBlob = await imgResponse.blob();
        storyFolder.file(`page${i + 1}.png`, imgBlob);
      } catch (error) {
        console.error(`Failed to export image for page ${i + 1} of story "${story.story}":`, error);
      }

      // For audio files
      if (page.mp3) {
        try {
          const audioResponse = await fetch(page.mp3);
          const audioBlob = await audioResponse.blob();
          storyFolder.file(`page${i + 1}.mp3`, audioBlob);
        } catch (error) {
          console.error(`Failed to export audio for page ${i + 1} of story "${story.story}":`, error);
        }
      }
    }
  }
  
  // Generate and save the ZIP file
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `AudioTales-Collection.zip`);
}

/**
 * Shares a story via the Web Share API if available
 */
export async function shareStory(story: Story): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }
  
  try {
    await navigator.share({
      title: `Children's Story: ${story.story}`,
      text: `Check out this children's story: "${story.story}"`,
      url: window.location.href,
    });
    return true;
  } catch (error) {
    console.error('Error sharing story:', error);
    return false;
  }
} 