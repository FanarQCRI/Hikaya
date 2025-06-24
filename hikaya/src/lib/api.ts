import type { StoryConfig, Story, StoryPage } from '@/types'

export class HikayatAPI {
  static async generateStory(config: StoryConfig): Promise<Story> {
    let attempts = 0;
    let sections: string[] = [];
    let arabicStory = '';
    const maxAttempts = 20;
    while (attempts < maxAttempts) {
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
        attempts++;
        await new Promise(res => setTimeout(res, 500));
        continue;
      }

      const data = await response.json();
      arabicStory = data.story;
      sections = this.parseStorySections(arabicStory);
      if (sections.length === 5) {
        break;
      }
      attempts++;
      await new Promise(res => setTimeout(res, 500));
    }
    if (sections.length !== 5) {
      // As a last resort, just return the whole story as one section
      sections = [arabicStory, '', '', '', ''];
    }

    // Generate images for each section
    const pages: StoryPage[] = []
    for (let i = 0; i < sections.length; i++) {
      const sectionText = sections[i]
      // Generate image for the section
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapter: sectionText }),
      })
      let imageUrl = ''
      if (imageResponse.ok) {
        const { imageUrl: url } = await imageResponse.json()
        imageUrl = url
      }
      pages.push({
        id: `page-${i + 1}`,
        arabicText: sectionText,
        englishText: '', // No translation for now
        imageUrl,
        pageNumber: i + 1,
      })
    }

    const story: Story = {
      id: `story-${Date.now()}`,
      title: this.extractTitleFromSections(sections),
      config,
      pages,
      totalPages: pages.length,
      createdAt: new Date(),
    }

    return story
  }

  // Robustly parse story into 5 sections: [title, chapter1, chapter2, chapter3, chapter4]
  private static parseStorySections(story: string): string[] {
    // Accepts both Arabic and English markers, e.g. [العنوان]:, [الفصل 1]:, [Title]:, [Chapter 1]:
    const sectionRegex = /\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g
    const matches = [...story.matchAll(/\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g)]
    if (matches.length !== 5) {
      // fallback: try to split by lines with colon and bracket
      const fallbackSections = story.split(/\n(?=\[.*?:\])/).map(s => s.trim()).filter(Boolean)
      if (fallbackSections.length === 5) return fallbackSections
      // fallback: try to split by double newlines
      const doubleNewlineSections = story.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
      if (doubleNewlineSections.length === 5) return doubleNewlineSections
      return []
    }
    // Split by the section markers
    const parts = story.split(/\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g)
      .map(s => s.trim()).filter(Boolean)
    return parts.length === 5 ? parts : []
  }

  private static extractTitleFromSections(sections: string[]): string {
    // The first section is always the title
    return sections[0] || 'قصة جديدة'
  }
} 