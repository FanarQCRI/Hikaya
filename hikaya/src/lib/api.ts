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

  // Generate quiz questions from story
  static async generateQuiz(storyId: string, storyContent: string[]): Promise<any[]> {
    // Join all story content into one string
    const storyText = storyContent.join('\n')
    const response = await fetch('/api/generate-mcqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story: storyText })
    })
    if (!response.ok) return []
    const data = await response.json()
    // The API returns a string of questions, need to parse into objects
    // Example format:
    // 1. السؤال\nأ. ...\nب. ...\nج. ...\nد. ...\nالإجابة الصحيحة: أ\n
    const questions: any[] = []
    const raw = data.questions || ''
    const questionBlocks = raw.split(/\n(?=\d+\.)/).map(q => q.trim()).filter(Boolean)
    for (const block of questionBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 6) continue
      let arabicText = lines[0].replace(/^\d+\.\s*/, '')
      const options = lines.slice(1, 5).map(opt => opt.replace(/^[أ-د]\.\s*/, ''))
      // Skip if question is just 'السؤال' or empty, or if any option looks like a question
      if (arabicText === 'السؤال' || !arabicText || options.some(opt => opt.includes('السؤال'))) continue
      const correctLine = lines.find(l => l.startsWith('الإجابة الصحيحة')) || ''
      const correctLetter = correctLine.match(/[أ-د]/)?.[0] || 'أ'
      const correctAnswer = { 'أ': 0, 'ب': 1, 'ج': 2, 'د': 3 }[correctLetter] ?? 0
      questions.push({
        id: `${storyId}-q${questions.length + 1}`,
        arabicText,
        englishText: '',
        options,
        correctAnswer,
        points: 2
      })
    }
    return questions
  }
}

// Utility to clean section markers and special characters from story text
function cleanSectionText(text: string) {
  return text
    .replace(/^\s*(\[.*?\]|Title|العنوان|Chapter ?\d+|الفصل ?\d+)[\s:：\-*]*\**\s*/i, '')
    .replace(/^[\s:：\-*]+|[\s:：\-*]+$/g, '')
    .trim();
}

// Fetch translations for all story pages (except title) in the background
export async function fetchStoryTranslationsInBackground(story: Story): Promise<Story> {
  const updatedPages = await Promise.all(story.pages.map(async (page) => {
    try {
      const res = await fetch('/api/translate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: cleanSectionText(page.arabicText) }),
      });
      if (res.ok) {
        const { translation } = await res.json();
        return { ...page, englishText: translation };
      }
    } catch {}
    return page;
  }));
  return { ...story, pages: updatedPages };
} 