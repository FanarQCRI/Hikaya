import type { StoryConfig, Story, StoryPage } from '@/types'
import { cleanChapterText } from '@/lib/utils'

export class HikayatAPI {
  static async generateStory(config: StoryConfig): Promise<Story> {
    let attempts = 0;
    let sections: string[] = [];
    let arabicStory = '';
    const maxAttempts = 7; // Increased attempts for better quality
    
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
    // First, clean the story of instruction headers using comprehensive patterns
    const cleanedStory = story
      // Remove instruction headers that might appear in the content (at start of lines)
      .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
      .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
      .replace(/^(الفصل\s*(الأول|الثاني|الثالث|الرابع|الخامس))\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
      .replace(/^(\d+|[أ-ي]+)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*$/gim, '')
      // Remove ordinal numbers and instruction text anywhere in the text (not just at start)
      .replace(/(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*?(?=\n|$)/gim, '')
      .replace(/(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*?(?=\n|$)/gim, '')
      // Remove standalone ordinal numbers that might appear in text (including typos)
      .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/gim, '')
      // Remove instruction text that might appear anywhere
      .replace(/(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية)\s*أو\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية)/gim, '')
      // Remove any line that starts with "لأول:" or similar patterns
      .replace(/^لأول\s*:.*$/gim, '')
      .replace(/^لثاني\s*:.*$/gim, '')
      .replace(/^لثالث\s*:.*$/gim, '')
      .replace(/^لرابع\s*:.*$/gim, '')
      .replace(/^لخامس\s*:.*$/gim, '')
      // Remove ordinal numbers at the beginning of sentences or paragraphs (with or without spaces)
      .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '')
      .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '')
      // Remove ordinal numbers that appear at the start of any sentence (after periods, exclamation, question marks)
      .replace(/([.!?])\s*(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '$1 ')
      .replace(/([.!?])\s*(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '$1 ')
      // Remove ordinal numbers that appear anywhere in the text (more aggressive)
      .replace(/\s+(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, ' ')
      .replace(/\s+(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, ' ')
    
    // Accepts both Arabic and English markers, e.g. [العنوان]:, [الفصل 1]:, [Title]:, [Chapter 1]:
    const sectionRegex = /\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g
    const matches = [...cleanedStory.matchAll(/\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g)]
    
    if (matches.length !== 5) {
      // fallback: try to split by lines with colon and bracket
      const fallbackSections = cleanedStory.split(/\n(?=\[.*?:\])/).map(s => s.trim()).filter(Boolean)
      if (fallbackSections.length === 5) return fallbackSections
      // fallback: try to split by double newlines
      const doubleNewlineSections = cleanedStory.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
      if (doubleNewlineSections.length === 5) return doubleNewlineSections
      return []
    }
    
    // Split by the section markers
    const parts = cleanedStory.split(/\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g)
      .map(s => s.trim()).filter(Boolean)
    
    // Clean each section of any remaining instruction text using comprehensive patterns
    const cleanedParts = parts.map(part => 
      part
        // Remove instruction headers that might appear in the content (at start of lines)
        .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
        .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
        .replace(/^(الفصل\s*(الأول|الثاني|الثالث|الرابع|الخامس))\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
        .replace(/^(\d+|[أ-ي]+)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*$/gim, '')
        // Remove ordinal numbers and instruction text anywhere in the text (not just at start)
        .replace(/(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*?(?=\n|$)/gim, '')
        .replace(/(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*?(?=\n|$)/gim, '')
        // Remove standalone ordinal numbers that might appear in text (including typos)
        .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/gim, '')
        // Remove instruction text that might appear anywhere
        .replace(/(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية)\s*أو\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية)/gim, '')
        // Remove any line that starts with "لأول:" or similar patterns
        .replace(/^لأول\s*:.*$/gim, '')
        .replace(/^لثاني\s*:.*$/gim, '')
        .replace(/^لثالث\s*:.*$/gim, '')
        .replace(/^لرابع\s*:.*$/gim, '')
        .replace(/^لخامس\s*:.*$/gim, '')
        // Remove ordinal numbers at the beginning of sentences or paragraphs (with or without spaces)
        .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '')
        .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '')
        // Remove ordinal numbers that appear at the start of any sentence (after periods, exclamation, question marks)
        .replace(/([.!?])\s*(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '$1 ')
        .replace(/([.!?])\s*(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '$1 ')
        // Remove ordinal numbers that appear anywhere in the text (more aggressive)
        .replace(/\s+(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, ' ')
        .replace(/\s+(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, ' ')
        .trim()
    )
    
    return cleanedParts.length === 5 ? cleanedParts : []
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
      const newQuestions = this.parseMCQQuestions(raw, storyId, storyText)
      
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
  
  // Verify that the correct answer exists in the story text
  private static verifyAnswerInStory(correctAnswer: string, storyText: string): boolean {
    // Clean the correct answer and story text for comparison
    const cleanAnswer = correctAnswer.replace(/[^\u0600-\u06FF\s]/g, '').trim().toLowerCase()
    const cleanStory = storyText.replace(/[^\u0600-\u06FF\s]/g, '').trim().toLowerCase()
    
    // Check if the answer exists as a complete phrase
    if (cleanStory.includes(cleanAnswer)) {
      return true
    }
    
    // Check if the answer exists as individual words (for longer answers)
    const answerWords = cleanAnswer.split(/\s+/).filter(word => word.length > 2)
    const storyWords = cleanStory.split(/\s+/)
    
    // If answer has multiple words, check if most words exist in story
    if (answerWords.length > 1) {
      const matchingWords = answerWords.filter(word => 
        storyWords.some(storyWord => storyWord.includes(word) || word.includes(storyWord))
      )
      return matchingWords.length >= Math.ceil(answerWords.length * 0.7) // 70% of words should match
    }
    
    // For single words, check if the word exists in story
    if (answerWords.length === 1) {
      return storyWords.some(storyWord => 
        storyWord.includes(answerWords[0]) || answerWords[0].includes(storyWord)
      )
    }
    
    return false
  }
  
  // Parse MCQ questions with validation
  private static parseMCQQuestions(raw: string, storyId: string, storyText: string): any[] {
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
        const genericQuestions = ['ما هي القصة؟', 'ماذا حدث؟', 'من هو؟', 'أين؟', 'متى؟', 'كيف؟', 'لماذا؟']
        if (genericQuestions.some(gq => arabicText.includes(gq))) {
          console.log('Skipping generic question:', arabicText)
          continue
        }
        
        // Check if question asks about information not likely to be in the story
        const problematicPatterns = [
          /كم عمر/, /كم سنة/, /أي يوم/, /أي شهر/, /أي سنة/, /أي تاريخ/,
          /كم ساعة/, /كم دقيقة/, /كم ثانية/,
          /ما هو لون/, /ما هي الألوان/,
          /كم عدد/, /كم مرة/,
          /أي نوع/, /أي شكل/, /أي حجم/
        ]
        if (problematicPatterns.some(pattern => pattern.test(arabicText))) {
          console.log('Skipping question with problematic pattern:', arabicText)
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
        if (correctOption.length < 3 || ['نعم', 'لا', 'ربما', 'لا أعرف', 'غير مذكور', 'غير معروف'].includes(correctOption)) {
          console.log('Skipping block with invalid correct answer option:', correctOption)
          continue
        }
        
        // Verify that the correct answer actually exists in the story
        if (!this.verifyAnswerInStory(correctOption, storyText)) {
          console.log('Skipping question - correct answer not found in story:', correctOption)
          continue
        }
        
        // Enhanced content validation: check if the question makes sense
        const questionWords = arabicText.split(/\s+/).filter(word => word.length > 2)
        const hasSpecificContent = questionWords.some(word => 
          /[أ-ي]{3,}/.test(word) && 
          !['ما', 'من', 'أين', 'متى', 'كيف', 'لماذا', 'أي', 'كم', 'هل'].includes(word)
        )
        
        if (!hasSpecificContent) {
          console.log('Skipping question without specific content:', arabicText)
          continue
        }
        
        // Check if all options are reasonable length
        if (options.some(opt => opt.length < 2 || opt.length > 100)) {
          console.log('Skipping block with unreasonable option lengths')
          continue
        }
        
        // Check if the correct answer is not too obvious (all options should be plausible)
        const allOptionsSimilarLength = options.every(opt => 
          opt.length >= Math.min(...options.map(o => o.length)) - 5 &&
          opt.length <= Math.max(...options.map(o => o.length)) + 5
        )
        
        if (!allOptionsSimilarLength) {
          console.log('Skipping block with too obvious correct answer (length mismatch)')
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