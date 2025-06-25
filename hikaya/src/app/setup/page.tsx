'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, Star, Sparkles, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { themeOptions } from '@/data/themes'
import { StoryConfig } from '@/types'
import { HikayatAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { saveStoryToIndexedDB } from '@/lib/utils'
import LoadingOverlay from '@/components/LoadingOverlay'

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
    if (!selectedTheme || (selectedTheme === 'custom' && !customKeyword.trim())) return

    setIsGenerating(true)
    try {
      const config: StoryConfig = {
        difficulty,
        theme: selectedTheme === 'custom' ? customKeyword.trim() : selectedTheme,
        customKeyword: selectedTheme === 'custom' ? customKeyword.trim() : undefined
      }

      const story = await HikayatAPI.generateStory(config)
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
    <>
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isGenerating} 
        theme={selectedTheme === 'custom' ? customKeyword : selectedTheme}
      />

      <div className="min-h-screen flex items-center justify-center bg-vignette relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-10 animate-float">
            <Star className="text-accent w-10 h-10 opacity-70" />
          </div>
          <div className="absolute top-32 right-24 animate-sparkle">
            <Sparkles className="text-primary-light w-8 h-8 opacity-80" />
          </div>
          <div className="absolute bottom-20 left-1/3 animate-float">
            <Star className="text-primary w-6 h-6 opacity-40" />
          </div>
          <div className="absolute bottom-10 right-1/4 animate-sparkle">
            <Sparkles className="text-accent w-7 h-7 opacity-50" />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10" {...({} as any)}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english mb-8 transition-colors text-lg font-medium"
            >
              العودة للصفحة الرئيسية
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-extrabold text-text-arabic text-shadow mb-3 tracking-tight">
                اختر قصة جديدة
              </h1>
              <p className="text-2xl text-text-english/90 font-semibold text-shadow">
                Choose a New Story
              </p>
            </div>
          </motion.div>

          {/* Difficulty Selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12" {...({} as any)}>
            <h2 className="text-2xl font-bold text-text-arabic mb-7 text-center text-shadow">مستوى الصعوبة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { value: 'beginner', label: 'مبتدئ', english: 'Beginner', description: 'Simple words and short sentences' },
                { value: 'intermediate', label: 'متوسط', english: 'Intermediate', description: 'More complex vocabulary' },
                { value: 'advanced', label: 'متقدم', english: 'Advanced', description: 'Rich language and longer stories' }
              ].map((level) => {
                const selected = difficulty === level.value
                return (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value as any)}
                    className={cn(
                      "glass-card p-7 rounded-3xl border-2 transition-all duration-200 text-center shadow-md relative hover:scale-105",
                      selected
                        ? "border-4 border-primary ring-4 ring-primary/30 bg-primary text-white shadow-lg scale-105 brightness-110"
                        : "border-warm/30 bg-white/60 hover:border-primary/40 hover:bg-white/80"
                    )}
                  >
                    {selected && (
                      <CheckCircle2 className="absolute top-2 right-2 text-accent w-6 h-6 drop-shadow" />
                    )}
                    <div className="text-3xl mb-2">{level.value === 'beginner' ? '🌟' : level.value === 'intermediate' ? '⭐' : '💫'}</div>
                    <h3 className="text-xl font-bold text-text-arabic mb-1">{level.label}</h3>
                    <p className="text-base text-text-english/80 mb-1">{level.english}</p>
                    <p className="text-xs text-text-english/60">{level.description}</p>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Theme Selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12" {...({} as any)}>
            <h2 className="text-2xl font-bold text-text-arabic mb-7 text-center text-shadow">اختر موضوع القصة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {themeOptions.map((theme) => {
                const selected = selectedTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={cn(
                      "glass-card p-5 rounded-2xl border-2 transition-all duration-200 text-center shadow-md hover:scale-105 relative group",
                      selected
                        ? "border-4 border-primary ring-4 ring-primary/30 bg-primary text-white shadow-lg scale-105 brightness-110"
                        : "border-warm/30 bg-white/60 hover:border-primary/40 hover:bg-white/80"
                    )}
                  >
                    {selected && (
                      <CheckCircle2 className="absolute top-2 right-2 text-accent w-6 h-6 drop-shadow" />
                    )}
                    <div className="text-4xl mb-2 drop-shadow-lg">{theme.icon}</div>
                    <h3 className="text-base font-bold text-text-arabic mb-1">{theme.arabicName}</h3>
                    <p className="text-xs text-text-english/80 mb-2">{theme.name}</p>
                  </button>
                )
              })}
            </div>

            {/* Custom Theme */}
            <div className="max-w-md mx-auto">
              <button
                onClick={handleCustomTheme}
                className={cn(
                  "glass-card w-full p-5 rounded-2xl border-2 transition-all duration-200 text-center shadow-md hover:scale-105 relative",
                  selectedTheme === 'custom'
                    ? "border-4 border-primary ring-4 ring-primary/30 bg-primary text-white shadow-lg scale-105 brightness-110"
                    : "border-warm/30 bg-white/60 hover:border-primary/40 hover:bg-white/80"
                )}
              >
                {selectedTheme === 'custom' && (
                  <CheckCircle2 className="absolute top-2 right-2 text-accent w-6 h-6 drop-shadow" />
                )}
                <div className="text-3xl mb-2">✨</div>
                <h3 className="text-lg font-bold text-text-arabic mb-1">موضوع مخصص</h3>
                <p className="text-base text-text-english/80">Custom Theme</p>
              </button>

              {selectedTheme === 'custom' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4" {...({} as any)}>
                  <div className="relative">
                    <input
                      type="text"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      placeholder="اكتب كلمة مفتاحية للقصة..."
                      className="w-full p-4 rounded-xl border border-warm/30 bg-white/80 text-text-arabic text-lg text-center placeholder:text-text-english/50 focus:outline-none focus:border-primary shadow"
                    />
                    {customKeyword && (
                      <button
                        type="button"
                        onClick={() => setCustomKeyword('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary text-xl"
                        aria-label="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center" {...({} as any)}>
            <button
              onClick={handleGenerateStory}
              disabled={!canGenerate || isGenerating}
              className={cn(
                "inline-flex items-center gap-4 px-10 py-5 text-2xl font-extrabold rounded-full transition-all duration-300",
                canGenerate && !isGenerating
                  ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-xl hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-accent/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <BookOpen className="w-7 h-7" />
              اروي لي قصة
              <span className="text-lg opacity-90 font-normal">Tell me a story</span>
            </button>
          </motion.div>
        </div>
      </div>
    </>
  )
}
