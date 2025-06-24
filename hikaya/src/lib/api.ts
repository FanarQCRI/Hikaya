import type { StoryConfig, Story, StoryPage } from '@/types'

export class HikayatAPI {
  static async generateStory(config: StoryConfig): Promise<Story> {
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: config.theme,
        level: config.difficulty,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate story')
    }

    const { story: arabicStory } = await response.json()
    
    // Parse the story into chapters
    const chapters = this.parseStoryIntoChapters(arabicStory)
    
    // Generate images and translations for each chapter
    const pages: StoryPage[] = []
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      
      // Generate image for the chapter
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapter }),
      })
      
      if (!imageResponse.ok) {
        throw new Error('Failed to generate image')
      }
      
      const { imageUrl } = await imageResponse.json()
      
      // Translate the chapter
      const translationResponse = await fetch('/api/translate-chapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapter }),
      })
      
      if (!translationResponse.ok) {
        throw new Error('Failed to translate chapter')
      }
      
      const { translation: englishText } = await translationResponse.json()
      
      pages.push({
        id: `page-${i + 1}`,
        arabicText: chapter,
        englishText,
        imageUrl,
        pageNumber: i + 1,
      })
    }
    
    // Generate audio for the first page
    const audioResponse = await fetch('/api/story-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ story: pages[0].arabicText }),
    })
    
    if (audioResponse.ok) {
      const audioBlob = await audioResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      pages[0].audioUrl = audioUrl
    }
    
    const story: Story = {
      id: `story-${Date.now()}`,
      title: this.extractTitle(arabicStory),
      config,
      pages,
      totalPages: pages.length,
      createdAt: new Date(),
    }
    
    return story
  }
  
  private static parseStoryIntoChapters(story: string): string[] {
    // Split the story by chapter titles (lines that end with :)
    const lines = story.split('\n').filter(line => line.trim())
    const chapters: string[] = []
    let currentChapter = ''
    
    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('Title:')) {
        // This is a chapter title
        if (currentChapter.trim()) {
          chapters.push(currentChapter.trim())
        }
        currentChapter = line + '\n'
      } else {
        currentChapter += line + '\n'
      }
    }
    
    // Add the last chapter
    if (currentChapter.trim()) {
      chapters.push(currentChapter.trim())
    }
    
    return chapters
  }
  
  private static extractTitle(story: string): string {
    const lines = story.split('\n')
    for (const line of lines) {
      if (line.startsWith('Title:')) {
        return line.replace('Title:', '').trim()
      }
    }
    return 'قصة جديدة' // Default title
  }
} 