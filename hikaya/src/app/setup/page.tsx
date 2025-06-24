'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Star, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { themeOptions } from '@/data/themes'
import { StoryConfig } from '@/types'
import { HikayatAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { saveStoryToIndexedDB } from '@/lib/utils'

export default function SetupPage() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [customKeyword, setCustomKeyword] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setCustomKeyword('')
  }

  const handleCustomTheme = () => {
    setSelectedTheme('custom')
  }

  const handleGenerateStory = async () => {
    if (!selectedTheme || (selectedTheme === 'custom' && !customKeyword.trim())) {
      return
    }

    setIsGenerating(true)
    
    try {
      const config: StoryConfig = {
        difficulty,
        theme: selectedTheme === 'custom' ? customKeyword.trim() : selectedTheme,
        customKeyword: selectedTheme === 'custom' ? customKeyword.trim() : undefined
      }

      const story = await HikayatAPI.generateStory(config)
      
      // Store story in IndexedDB
      await saveStoryToIndexedDB(story.id, story)
      
      router.push(`/story/${story.id}`)
    } catch (error) {
      console.error('Error generating story:', error)
      alert('Failed to generate story. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = selectedTheme && (selectedTheme !== 'custom' || customKeyword.trim())

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-float">
          <Star className="text-accent w-8 h-8 opacity-60" />
        </div>
        <div className="absolute top-40 right-20 animate-sparkle">
          <Sparkles className="text-primary-light w-6 h-6 opacity-70" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للصفحة الرئيسية
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-text-arabic mb-4">
              اختر قصة جديدة
            </h1>
            <p className="text-xl text-text-english/80">
              Choose a New Story
            </p>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Difficulty Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold text-text-arabic mb-6 text-center">
              مستوى الصعوبة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { value: 'beginner', label: 'مبتدئ', english: 'Beginner', description: 'Simple words and short sentences' },
                { value: 'intermediate', label: 'متوسط', english: 'Intermediate', description: 'More complex vocabulary' },
                { value: 'advanced', label: 'متقدم', english: 'Advanced', description: 'Rich language and longer stories' }
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setDifficulty(level.value as any)}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all duration-300 text-center",
                    difficulty === level.value
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-warm/30 bg-white/60 hover:border-primary/50 hover:bg-white/80"
                  )}
                >
                  <div className="text-2xl mb-2">{level.value === 'beginner' ? '🌟' : level.value === 'intermediate' ? '⭐' : '💫'}</div>
                  <h3 className="text-lg font-semibold text-text-arabic mb-1">{level.label}</h3>
                  <p className="text-sm text-text-english/70 mb-2">{level.english}</p>
                  <p className="text-xs text-text-english/60">{level.description}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Theme Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold text-text-arabic mb-6 text-center">
              اختر موضوع القصة
            </h2>
            
            {/* Theme Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {themeOptions.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105",
                    selectedTheme === theme.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-warm/30 bg-white/60 hover:border-primary/50 hover:bg-white/80"
                  )}
                >
                  <div className="text-3xl mb-2">{theme.icon}</div>
                  <h3 className="text-sm font-semibold text-text-arabic mb-1">{theme.arabicName}</h3>
                  <p className="text-xs text-text-english/70">{theme.name}</p>
                </button>
              ))}
            </div>

            {/* Custom Theme */}
            <div className="max-w-md mx-auto">
              <button
                onClick={handleCustomTheme}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all duration-300 text-center",
                  selectedTheme === 'custom'
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-warm/30 bg-white/60 hover:border-primary/50 hover:bg-white/80"
                )}
              >
                <div className="text-2xl mb-2">✨</div>
                <h3 className="text-lg font-semibold text-text-arabic mb-1">موضوع مخصص</h3>
                <p className="text-sm text-text-english/70">Custom Theme</p>
              </button>

              {selectedTheme === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    placeholder="اكتب كلمة مفتاحية للقصة..."
                    className="w-full p-3 rounded-lg border border-warm/30 bg-white/80 text-text-arabic text-center placeholder:text-text-english/50 focus:outline-none focus:border-primary"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <button
              onClick={handleGenerateStory}
              disabled={!canGenerate || isGenerating}
              className={cn(
                "inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-full shadow-lg transition-all duration-300",
                canGenerate && !isGenerating
                  ? "bg-gradient-to-r from-primary to-primary-light text-white hover:scale-105 hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري إنشاء القصة...
                </>
              ) : (
                <>
                  <BookOpen className="w-6 h-6" />
                  اروي لي قصة
                  <span className="text-sm opacity-90">Tell me a story</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 