import type { StoryConfig, Story, StoryPage } from '@/types'
import { cleanChapterText } from '@/lib/utils'

export class HikayatAPI {
  static async generateStory(config: StoryConfig): Promise<Story> {
    let attempts = 0;
    let sections: string[] = [];
    let arabicStory = '';
    const maxAttempts = 5; // Increased attempts for better quality
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempting story generation (attempt ${attempts}/${maxAttempts})`);
      
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: config.theme,
          level: config.difficulty,
          attempt: attempts
        }),
      })

      if (!response.ok) {
        console.log(`Story generation failed on attempt ${attempts}`);
        await new Promise(res => setTimeout(res, 1000));
        continue;
      }

      const data = await response.json();
      arabicStory = data.story;
      sections = this.parseStorySections(arabicStory);
      
      // Validate story quality
      if (this.validateStoryQuality(sections, arabicStory)) {
        console.log(`Successfully generated quality story on attempt ${attempts}`);
        break;
      }
      
      console.log(`Story quality check failed on attempt ${attempts}, retrying...`);
      await new Promise(res => setTimeout(res, 1000));
    }
    
    if (sections.length !== 5) {
      console.warn(`Warning: Could not parse story into 5 sections, using fallback`);
      // As a last resort, just return the whole story as one section
      sections = [arabicStory, '', '', '', ''];
    }

    // Generate images for each section
    const pages: StoryPage[] = []
    for (let i = 0; i < sections.length; i++) {
      const sectionText = cleanChapterText(sections[i])
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

  // Validate story quality and coherence
  private static validateStoryQuality(sections: string[], fullStory: string): boolean {
    // Check if we have the right number of sections
    if (sections.length !== 5) {
      console.log('Story validation failed: Wrong number of sections');
      return false;
    }
    
    // Check if each section has meaningful content
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section || section.length < 20) {
        console.log(`Story validation failed: Section ${i + 1} too short or empty`);
        return false;
      }
    }
    
    // Check for logical story elements
    const storyText = fullStory.toLowerCase();
    const hasCharacters = /(طفل|ولد|بنت|أم|أب|عائلة|صديق)/.test(storyText);
    const hasAction = /(ذهب|جاء|فعل|قال|رأى|سمع)/.test(storyText);
    const hasProblem = /(مشكلة|صعوبة|تحدي|خوف|قلق)/.test(storyText);
    const hasSolution = /(حل|نجح|تعلم|ساعد|فرح)/.test(storyText);
    
    if (!hasCharacters || !hasAction) {
      console.log('Story validation failed: Missing basic story elements');
      return false;
    }
    
    // Check for coherent plot structure
    const hasBeginning = sections[1] && sections[1].length > 30;
    const hasMiddle = sections[2] && sections[2].length > 30;
    const hasEnd = sections[3] && sections[3].length > 30;
    
    if (!hasBeginning || !hasMiddle || !hasEnd) {
      console.log('Story validation failed: Incomplete plot structure');
      return false;
    }
    
    console.log('Story validation passed: Quality story generated');
    return true;
  }

  // Generate quiz questions from story
  static async generateQuiz(storyId: string, storyContent: string[]): Promise<any[]> {
    // Join all story content into one string
    const storyText = storyContent.join('\n')
    
    // Try to generate questions with retries
    let questions: any[] = []
    let attempts = 0
    const maxAttempts = 5 // Increased max attempts to ensure we get 5 questions
    
    while (questions.length < 5 && attempts < maxAttempts) {
      attempts++
      console.log(`Attempting MCQ generation (attempt ${attempts}/${maxAttempts}) - need ${5 - questions.length} more questions`)
      
      const response = await fetch('/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          story: storyText,
          attempt: attempts // Pass attempt number for potential prompt adjustment
        })
      })
      
      if (!response.ok) {
        console.log(`API request failed on attempt ${attempts}`)
        continue
      }
      
      const data = await response.json()
      const raw = data.questions || ''
      console.log('LLM MCQ raw output:', raw)
      
      // Parse questions with validation
      const newQuestions = this.parseMCQQuestions(raw, storyId)
      
      // Add new questions to existing ones, avoiding duplicates
      for (const newQuestion of newQuestions) {
        const isDuplicate = questions.some(existing => 
          existing.arabicText === newQuestion.arabicText ||
          existing.options.join('') === newQuestion.options.join('')
        )
        if (!isDuplicate && questions.length < 5) {
          questions.push(newQuestion)
        }
      }
      
      if (questions.length < 5) {
        console.log(`Got ${questions.length}/5 questions, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
      }
    }
    
    console.log(`Final result: Generated ${questions.length} valid questions after ${attempts} attempts`)
    
    // If we still don't have 5 questions, log a warning but return what we have
    if (questions.length < 5) {
      console.warn(`Warning: Only generated ${questions.length}/5 questions after ${maxAttempts} attempts`)
    }
    
    return questions
  }
  
  // Parse MCQ questions with validation
  private static parseMCQQuestions(raw: string, storyId: string): any[] {
    const questions: any[] = []
    
    // Split into question blocks
    const questionBlocks = raw.split(/\n(?=\d+\.)/).map((q: string) => q.trim()).filter(Boolean)
    
    console.log(`Found ${questionBlocks.length} question blocks`)
    
    for (const block of questionBlocks) {
      try {
        const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean)
        if (lines.length < 6) {
          console.log('Skipping block with insufficient lines:', lines.length)
          continue
        }
        
        // Extract question text
        let arabicText = lines[0].replace(/^\d+\.\s*/, '').trim()
        
        // Extract options (lines 1-4 should be options)
        const options = lines.slice(1, 5).map((opt: string) => {
          const cleaned = opt.replace(/^[أ-دA-D]\.\s*/, '').trim()
          return cleaned
        })
        
        // Enhanced validation checks
        if (arabicText === 'السؤال' || !arabicText || arabicText.length < 10) {
          console.log('Skipping invalid question text:', arabicText)
          continue
        }
        
        // Check if question is too generic
        const genericQuestions = ['ما هي القصة؟', 'ماذا حدث؟', 'من هو؟', 'أين؟', 'متى؟']
        if (genericQuestions.some(gq => arabicText.includes(gq))) {
          console.log('Skipping generic question:', arabicText)
          continue
        }
        
        // Check if options are valid
        if (options.some((opt: string) => !opt || opt.length < 2 || opt.includes('السؤال'))) {
          console.log('Skipping block with invalid options:', options)
          continue
        }
        
        // Check for duplicate options
        const uniqueOptions = new Set(options)
        if (uniqueOptions.size !== options.length) {
          console.log('Skipping block with duplicate options')
          continue
        }
        
        // Check if options are too similar
        const similarOptions = options.some((opt1, i) => 
          options.some((opt2, j) => 
            i !== j && (opt1.includes(opt2) || opt2.includes(opt1)) && 
            Math.abs(opt1.length - opt2.length) < 3
          )
        )
        if (similarOptions) {
          console.log('Skipping block with too similar options')
          continue
        }
        
        // Extract correct answer
        const correctLine = lines.find((l: string) => l.includes('الإجابة الصحيحة')) || ''
        const correctLetterMatch = correctLine.match(/[:：]\s*([أ-دA-D])/)
        
        if (!correctLetterMatch) {
          console.log('Skipping block with invalid correct answer format:', correctLine)
          continue
        }
        
        const correctLetter = correctLetterMatch[1]
        const letterMap: Record<string, number> = { 
          'أ': 0, 'A': 0, 'a': 0,
          'ب': 1, 'B': 1, 'b': 1,
          'ج': 2, 'C': 2, 'c': 2,
          'د': 3, 'D': 3, 'd': 3
        }
        
        if (!(correctLetter in letterMap)) {
          console.log('Skipping block with invalid correct answer letter:', correctLetter)
          continue
        }
        
        const correctAnswer = letterMap[correctLetter]
        
        // Additional validation: ensure the correct answer index is valid
        if (correctAnswer < 0 || correctAnswer >= options.length) {
          console.log('Skipping block with invalid correct answer index:', correctAnswer)
          continue
        }
        
        // Check if correct answer option is too short or generic
        const correctOption = options[correctAnswer]
        if (correctOption.length < 3 || ['نعم', 'لا', 'ربما', 'لا أعرف'].includes(correctOption)) {
          console.log('Skipping block with invalid correct answer option:', correctOption)
          continue
        }
        
        questions.push({
          id: `${storyId}-q${questions.length + 1}`,
          arabicText,
          englishText: '',
          options,
          correctAnswer,
          points: 1
        })
        
        console.log(`Successfully parsed question ${questions.length}:`, {
          question: arabicText.substring(0, 50) + '...',
          options: options.map(opt => opt.substring(0, 30) + '...'),
          correctAnswer: correctAnswer,
          correctOption: correctOption
        })
        
      } catch (error) {
        console.error('Error parsing question block:', error, block)
        continue
      }
    }
    
    // Ensure we have exactly 5 questions
    if (questions.length !== 5) {
      console.log(`Warning: Generated ${questions.length} questions instead of 5`)
    }
    
    return questions
  }
}

// Fetch translations for all story pages (except title) in the background
export async function fetchStoryTranslationsInBackground(story: Story): Promise<Story> {
  const updatedPages = await Promise.all(story.pages.map(async (page) => {
    try {
      const res = await fetch('/api/translate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: cleanChapterText(page.arabicText) }),
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