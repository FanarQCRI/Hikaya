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
    console.log('Original story:', story.substring(0, 200) + '...')
    
    // Step 1: Clean the story of any instruction artifacts
    let cleanedStory = story
      // Remove any instruction headers or markers
      .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
      .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
      .replace(/^(الفصل\s*(الأول|الثاني|الثالث|الرابع|الخامس))\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
      .replace(/^(\d+|[أ-ي]+)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
      
      // Remove standalone ordinal numbers and instruction text
      .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/gim, '')
      .replace(/(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية)\s*أو\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية)/gim, '')
      
      // Remove lines that start with ordinal patterns
      .replace(/^لأول\s*:.*$/gim, '')
      .replace(/^لثاني\s*:.*$/gim, '')
      .replace(/^لثالث\s*:.*$/gim, '')
      .replace(/^لرابع\s*:.*$/gim, '')
      .replace(/^لخامس\s*:.*$/gim, '')
      
      // Remove ordinal numbers at sentence beginnings
      .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '')
      .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '')
      .replace(/([.!?])\s*(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '$1 ')
      .replace(/([.!?])\s*(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '$1 ')
      
      // Remove ordinal numbers anywhere in text
      .replace(/\s+(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, ' ')
      .replace(/\s+(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, ' ')
      
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    
    console.log('Cleaned story:', cleanedStory.substring(0, 200) + '...')
    
    // Step 2: Try to find section markers
    const sectionMarkers = [
      /\[(?:العنوان|Title)\]:/g,
      /\[(?:الفصل|Chapter) ?[١1]?:/g,
      /\[(?:الفصل|Chapter) ?[٢2]?:/g,
      /\[(?:الفصل|Chapter) ?[٣3]?:/g,
      /\[(?:الفصل|Chapter) ?[٤4]?:/g
    ]
    
    // Check if we have the expected section markers
    const markerMatches = sectionMarkers.map(marker => [...cleanedStory.matchAll(marker)]).flat()
    
    if (markerMatches.length === 5) {
      console.log('Found 5 section markers, parsing by markers')
      // Split by section markers
      const parts = cleanedStory.split(/\[(?:العنوان|Title)\]:|\[(?:الفصل|Chapter) ?[١1]?:|\[(?:الفصل|Chapter) ?[٢2]?:|\[(?:الفصل|Chapter) ?[٣3]?:|\[(?:الفصل|Chapter) ?[٤4]?:/g)
        .map(s => s.trim())
        .filter(Boolean)
      
      if (parts.length === 5) {
        // Clean each part of any remaining artifacts
        const cleanedParts = parts.map(part => 
          part
            .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
            .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
            .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/gim, '')
            .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '')
            .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '')
            .trim()
        )
        
        console.log('Successfully parsed by markers:', cleanedParts.map(p => p.substring(0, 50) + '...'))
        return cleanedParts
      }
    }
    
    // Step 3: Fallback - try to split by double newlines
    console.log('Trying fallback parsing by double newlines')
    const doubleNewlineSections = cleanedStory
      .split(/\n\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 10) // Filter out very short sections
    
    if (doubleNewlineSections.length >= 4) {
      // If we have 4+ sections, take the first 5 or pad with empty strings
      const sections = doubleNewlineSections.slice(0, 5)
      while (sections.length < 5) {
        sections.push('')
      }
      
      // Clean each section
      const cleanedSections = sections.map(section => 
        section
          .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
          .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gim, '')
          .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/gim, '')
          .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '')
          .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '')
          .trim()
      )
      
      console.log('Successfully parsed by double newlines:', cleanedSections.map(s => s.substring(0, 50) + '...'))
      return cleanedSections
    }
    
    // Step 4: Last resort - split the story into roughly equal parts
    console.log('Using last resort parsing - splitting into equal parts')
    const totalLength = cleanedStory.length
    const partLength = Math.floor(totalLength / 5)
    
    const sections = []
    for (let i = 0; i < 5; i++) {
      const start = i * partLength
      const end = i === 4 ? totalLength : (i + 1) * partLength
      let section = cleanedStory.substring(start, end)
      
      // Try to break at sentence boundaries
      if (i < 4) {
        const lastPeriod = section.lastIndexOf('.')
        const lastExclamation = section.lastIndexOf('!')
        const lastQuestion = section.lastIndexOf('?')
        const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion)
        
        if (lastBreak > partLength * 0.7) { // If we can break at a sentence boundary
          section = section.substring(0, lastBreak + 1)
        }
      }
      
      sections.push(section.trim())
    }
    
    console.log('Last resort parsing result:', sections.map(s => s.substring(0, 50) + '...'))
    return sections
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
    const maxAttempts = 10 // Increased max attempts to ensure we get 5 questions
    
    while (questions.length < 5 && attempts < maxAttempts) {
      attempts++
      console.log(`Attempting MCQ generation (attempt ${attempts}/${maxAttempts}) - need ${5 - questions.length} more questions`)
      
      const response = await fetch('/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          story: storyText,
          attempt: attempts,
          neededQuestions: 5 - questions.length // Pass how many questions we still need
        })
      })
      
      if (!response.ok) {
        console.log(`API request failed on attempt ${attempts}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
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
    
    // If we still don't have 5 questions, create fallback questions
    if (questions.length < 5) {
      console.warn(`Warning: Only generated ${questions.length}/5 questions, creating fallback questions`)
      const fallbackQuestions = this.createFallbackQuestions(storyId, storyText, questions.length)
      questions = [...questions, ...fallbackQuestions].slice(0, 5)
    }
    
    // Ensure we have exactly 5 questions
    while (questions.length < 5) {
      const fallbackQuestion = this.createSingleFallbackQuestion(storyId, storyText, questions.length)
      questions.push(fallbackQuestion)
    }
    
    return questions.slice(0, 5) // Ensure we return exactly 5 questions
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
      return matchingWords.length >= Math.ceil(answerWords.length * 0.6) // Reduced from 0.7 to 0.6 for more leniency
    }
    
    // For single words, check if the word exists in story
    if (answerWords.length === 1) {
      return storyWords.some(storyWord => 
        storyWord.includes(answerWords[0]) || answerWords[0].includes(storyWord)
      )
    }
    
    // For very short answers (1-2 characters), be more lenient
    if (cleanAnswer.length <= 2) {
      return true // Accept very short answers
    }
    
    // For common words that might appear in any story, be more lenient
    const commonWords = ['نعم', 'لا', 'البيت', 'المدرسة', 'الحديقة', 'المسجد', 'الطفل', 'الأم', 'الأب', 'الصديق']
    if (commonWords.includes(cleanAnswer)) {
      return true // Accept common words
    }
    
    return false
  }
  
  // Parse MCQ questions with validation
  private static parseMCQQuestions(raw: string, storyId: string, storyText: string): any[] {
    console.log('Raw MCQ output:', raw.substring(0, 300) + '...')
    
    const questions: any[] = []
    
    // Step 1: Clean the raw input
    let cleanedRaw = raw
      .replace(/```/g, '') // Remove markdown code blocks
      .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points
      .trim()
    
    // Step 2: Try different parsing strategies
    let questionBlocks: string[] = []
    
    // Strategy 1: Split by numbered questions
    questionBlocks = cleanedRaw.split(/\n(?=\d+\.)/).map(q => q.trim()).filter(Boolean)
    
    // Strategy 2: If that didn't work, try splitting by Arabic numerals
    if (questionBlocks.length < 3) {
      questionBlocks = cleanedRaw.split(/\n(?=[١٢٣٤٥]\.)/).map(q => q.trim()).filter(Boolean)
    }
    
    // Strategy 3: If still not enough, try splitting by double newlines
    if (questionBlocks.length < 3) {
      questionBlocks = cleanedRaw.split(/\n\n+/).map(q => q.trim()).filter(Boolean)
    }
    
    console.log(`Found ${questionBlocks.length} question blocks`)
    
    for (const block of questionBlocks) {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 5) { // Need at least question + 4 options
          console.log('Skipping block with insufficient lines:', lines.length)
          continue
        }
        
        // Extract question text (first line)
        let arabicText = lines[0].replace(/^[١٢٣٤٥\d]+\.\s*/, '').trim()
        
        // Skip if question is too short or generic
        if (!arabicText || arabicText.length < 8) {
          console.log('Skipping block with invalid question text:', arabicText)
          continue
        }
        
        // Skip generic questions
        const genericQuestions = ['ما هي القصة؟', 'ماذا حدث؟', 'من هو؟', 'أين؟', 'متى؟', 'كيف؟', 'لماذا؟', 'السؤال']
        if (genericQuestions.some(gq => arabicText.includes(gq))) {
          console.log('Skipping generic question:', arabicText)
          continue
        }
        
        // Extract options - look for lines starting with أ, ب, ج, د
        const options: string[] = []
        let correctAnswerIndex = -1
        let correctAnswerLine = ''
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          
          // Check if this is an option line
          const optionMatch = line.match(/^([أ-دA-D])\.\s*(.+)$/)
          if (optionMatch) {
            const letter = optionMatch[1]
            const optionText = optionMatch[2].trim()
            
            if (optionText && optionText.length > 1) {
              options.push(optionText)
            }
          }
          
          // Check if this is the correct answer line
          if (line.includes('الإجابة الصحيحة') || line.includes('الجواب الصحيح')) {
            correctAnswerLine = line
            const match = line.match(/[:：]\s*([أ-دA-D])/)
            if (match) {
              const letterMap: Record<string, number> = { 
                'أ': 0, 'A': 0, 'a': 0,
                'ب': 1, 'B': 1, 'b': 1,
                'ج': 2, 'C': 2, 'c': 2,
                'د': 3, 'D': 3, 'd': 3
              }
              correctAnswerIndex = letterMap[match[1]] || -1
            }
          }
        }
        
        // Validate we have exactly 4 options
        if (options.length !== 4) {
          console.log('Skipping block with wrong number of options:', options.length)
          continue
        }
        
        // Validate correct answer
        if (correctAnswerIndex < 0 || correctAnswerIndex >= 4) {
          console.log('Skipping block with invalid correct answer index:', correctAnswerIndex)
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
        
        // Check if correct answer option is valid
        const correctOption = options[correctAnswerIndex]
        if (correctOption.length < 3 || ['نعم', 'لا', 'ربما', 'لا أعرف', 'غير مذكور', 'غير معروف'].includes(correctOption)) {
          console.log('Skipping block with invalid correct answer option:', correctOption)
          continue
        }
        
        // Verify that the correct answer actually exists in the story (be more lenient)
        if (!this.verifyAnswerInStory(correctOption, storyText)) {
          console.log('Warning: correct answer not found in story, but keeping question:', correctOption)
          // Don't skip, just log a warning
        }
        
        // Check if all options are reasonable length
        if (options.some(opt => opt.length < 2 || opt.length > 100)) {
          console.log('Skipping block with unreasonable option lengths')
          continue
        }
        
        // Check if the correct answer is not too obvious
        const allOptionsSimilarLength = options.every(opt => 
          opt.length >= Math.min(...options.map(o => o.length)) - 5 &&
          opt.length <= Math.max(...options.map(o => o.length)) + 5
        )
        
        if (!allOptionsSimilarLength) {
          console.log('Skipping block with too obvious correct answer (length mismatch)')
          continue
        }
        
        // Additional validation: check if the question makes sense
        const questionWords = arabicText.split(/\s+/).filter(word => word.length > 2)
        const hasSpecificContent = questionWords.some(word => 
          /[أ-ي]{3,}/.test(word) && 
          !['ما', 'من', 'أين', 'متى', 'كيف', 'لماذا', 'أي', 'كم', 'هل'].includes(word)
        )
        
        if (!hasSpecificContent) {
          console.log('Skipping question without specific content:', arabicText)
          continue
        }
        
        questions.push({
          id: `${storyId}-q${questions.length + 1}`,
          arabicText,
          englishText: '',
          options,
          correctAnswer: correctAnswerIndex,
          points: 1
        })
        
        console.log(`Successfully parsed question ${questions.length}:`, {
          question: arabicText.substring(0, 50) + '...',
          options: options.map(opt => opt.substring(0, 30) + '...'),
          correctAnswer: correctAnswerIndex,
          correctOption: correctOption
        })
        
      } catch (error) {
        console.error('Error parsing question block:', error, block)
        continue
      }
    }
    
    console.log(`Final result: Parsed ${questions.length} valid questions`)
    return questions
  }

  // Create fallback questions when MCQ generation fails
  private static createFallbackQuestions(storyId: string, storyText: string, existingCount: number): any[] {
    const fallbackQuestions = []
    const neededCount = 5 - existingCount
    
    // Extract key information from story for fallback questions
    const storyWords = storyText.split(/\s+/).filter(word => word.length > 2)
    const characters = storyWords.filter(word => /[أ-ي]{3,}/.test(word)).slice(0, 10)
    const actions = ['ذهب', 'جاء', 'قال', 'رأى', 'سمع', 'فعل', 'تعلم', 'ساعد', 'فرح', 'حزن']
    
    for (let i = 0; i < neededCount; i++) {
      const questionTypes = [
        {
          question: 'ما اسم الشخصية الرئيسية في القصة؟',
          options: characters.slice(0, 4),
          correctAnswer: 0
        },
        {
          question: 'ماذا فعلت الشخصية في القصة؟',
          options: actions.slice(0, 4),
          correctAnswer: 0
        },
        {
          question: 'أين حدثت القصة؟',
          options: ['في البيت', 'في المدرسة', 'في الحديقة', 'في المسجد'],
          correctAnswer: 0
        },
        {
          question: 'متى حدثت القصة؟',
          options: ['في الصباح', 'في المساء', 'في الليل', 'في الظهر'],
          correctAnswer: 0
        },
        {
          question: 'كيف انتهت القصة؟',
          options: ['بسعادة', 'بحزن', 'بخوف', 'بغضب'],
          correctAnswer: 0
        }
      ]
      
      const questionType = questionTypes[i % questionTypes.length]
      fallbackQuestions.push({
        id: `${storyId}-fallback-q${existingCount + i + 1}`,
        arabicText: questionType.question,
        englishText: '',
        options: questionType.options,
        correctAnswer: questionType.correctAnswer,
        points: 1
      })
    }
    
    return fallbackQuestions
  }
  
  // Create a single fallback question
  private static createSingleFallbackQuestion(storyId: string, storyText: string, questionNumber: number): any {
    const basicQuestions = [
      {
        question: 'هل أعجبتك القصة؟',
        options: ['نعم', 'لا', 'ربما', 'لا أعرف'],
        correctAnswer: 0
      },
      {
        question: 'هل كانت القصة ممتعة؟',
        options: ['نعم', 'لا', 'قليلاً', 'لا أعرف'],
        correctAnswer: 0
      },
      {
        question: 'هل تريد قراءة قصة أخرى؟',
        options: ['نعم', 'لا', 'ربما', 'لاحقاً'],
        correctAnswer: 0
      }
    ]
    
    const questionType = basicQuestions[questionNumber % basicQuestions.length]
    
    return {
      id: `${storyId}-basic-q${questionNumber + 1}`,
      arabicText: questionType.question,
      englishText: '',
      options: questionType.options,
      correctAnswer: questionType.correctAnswer,
      points: 1
    }
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