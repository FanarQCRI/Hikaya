'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Volume2, Globe, ChevronLeft, ChevronRight, Home, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Story, StoryPage } from '@/types'
import { HikayatAPI, fetchStoryTranslationsInBackground } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getStoryFromIndexedDB } from '@/lib/utils'
import { generateAudioFromText, playAudio, stopAudio } from '@/lib/audio'
import React from 'react'
import { cleanChapterText } from '@/lib/utils'

// Add animated equalizer SVG for loading
function EqualizerIcon() {
  return (
    <span className="flex items-end gap-0.5 h-5">
      <span className="block w-1 h-2 bg-blue-400 animate-eq1 rounded-sm" />
      <span className="block w-1 h-4 bg-blue-500 animate-eq2 rounded-sm" />
      <span className="block w-1 h-3 bg-blue-400 animate-eq3 rounded-sm" />
    </span>
  );
}

// Move the global style block for equalizer animation to the top level
<style jsx global>{`
@keyframes eq1 { 0%,100%{height:8px} 50%{height:20px} }
@keyframes eq2 { 0%,100%{height:20px} 50%{height:8px} }
@keyframes eq3 { 0%,100%{height:14px} 50%{height:20px} }
.animate-eq1 { animation: eq1 1s infinite; }
.animate-eq2 { animation: eq2 1s infinite; }
.animate-eq3 { animation: eq3 1s infinite; }
`}</style>

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const [story, setStory] = useState<Story | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [showEnglish, setShowEnglish] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Load story from IndexedDB
    setIsLoading(true)
    getStoryFromIndexedDB(id).then((result) => {
      if (result) setStory(result)
      setIsLoading(false)
      // Start background translation if needed
      if (result && result.pages.some((p: StoryPage, idx: number) => idx !== 0 && !p.englishText)) {
        fetchStoryTranslationsInBackground(result).then(updated => {
          setStory(updated)
          // Optionally, save updated story to IndexedDB here
        })
      }
    })
  }, [id])

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        stopAudio(audioRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleNextPage = () => {
    if (story && currentPage < story.pages.length - 1) {
      // Stop any playing audio when changing pages
      if (audioRef.current) {
        stopAudio(audioRef.current)
        audioRef.current = null
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      setIsPlaying(false)
      setIsGeneratingAudio(false)
      
      setCurrentPage(prev => prev + 1)
      setShowEnglish(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      // Stop any playing audio when changing pages
      if (audioRef.current) {
        stopAudio(audioRef.current)
        audioRef.current = null
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      setIsPlaying(false)
      setIsGeneratingAudio(false)
      
      setCurrentPage(prev => prev - 1)
      setShowEnglish(false)
    }
  }

  const handlePlayAudio = async (page: StoryPage) => {
    try {
      // Clear any previous errors
      setAudioError(null)
      
      // Stop any currently playing audio
      if (audioRef.current) {
        stopAudio(audioRef.current)
        audioRef.current = null
      }

      setIsPlaying(true)
      setIsGeneratingAudio(true)

      // Generate audio for the current page text
      const cleanText = cleanChapterText(page.arabicText)
      const generatedAudioUrl = await generateAudioFromText(cleanText)
      
      setAudioUrl(generatedAudioUrl)
      setIsGeneratingAudio(false)

      // Play the audio
      await playAudio(generatedAudioUrl)
      
      setIsPlaying(false)
      setAudioUrl(null)
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
      setIsGeneratingAudio(false)
      setAudioUrl(null)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في تشغيل الصوت'
      setAudioError(errorMessage)
      
      // Clear error after 5 seconds
      setTimeout(() => setAudioError(null), 5000)
    }
  }

  const handleFinishStory = () => {
    if (story) {
      // Save only minimal story data for quiz
      const minimalStory = {
        id: story.id,
        title: story.title,
        pages: story.pages.map(p => ({ arabicText: p.arabicText, englishText: p.englishText || '' }))
      }
      localStorage.setItem('currentStory', JSON.stringify(minimalStory))
      router.push(`/quiz/${story.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-arabic text-lg">جاري تحميل القصة...</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-arabic text-lg mb-4">لم يتم العثور على القصة</p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة لإنشاء قصة جديدة
          </Link>
        </div>
      </div>
    )
  }

  const currentPageData = story.pages[currentPage]
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === story.pages.length - 1

  // Debug logging
  console.log('Current page data:', currentPageData)
  console.log('Image URL:', currentPageData?.imageUrl)
  console.log('Arabic text:', currentPageData?.arabicText?.substring(0, 50))

  // Show completion screen if last page and showCompletion is true
  if (showCompletion && story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 text-center max-w-2xl mx-auto w-full"
          {...({} as any)}
        >
          {/* Return to Story Button */}
          <button
            onClick={() => setShowCompletion(false)}
            className="self-start mb-6 px-4 py-2 text-primary font-bold rounded-full hover:bg-primary/10 transition-all flex items-center gap-2 text-base"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للقصة
          </button>
          
          {/* Celebration Content */}
          <div className="mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-arabic mb-3">
              أحسنت! أنهيت القصة
            </h1>
            <p className="text-lg text-text-english/80 mb-6">
              Great job! You finished the story. Are you ready for a fun quiz?
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => {
                if (story) {
                  const minimalStory = {
                    id: story.id,
                    title: story.title,
                    pages: story.pages.map(p => ({ arabicText: p.arabicText, englishText: p.englishText || '' }))
                  }
                  localStorage.setItem('currentStory', JSON.stringify(minimalStory))
                  router.push(`/quiz/${story.id}`)
                }
              }}
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white text-lg md:text-xl font-bold rounded-full shadow-xl hover:scale-105 transition-all duration-300"
            >
              ابدأ الاختبار
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                if (story) {
                  const minimalStory = {
                    id: story.id,
                    title: story.title,
                    pages: story.pages.map(p => ({ arabicText: p.arabicText, englishText: p.englishText || '' }))
                  }
                  localStorage.setItem('currentStory', JSON.stringify(minimalStory))
                  router.push(`/audio-understanding/${story.id}`)
                }
              }}
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-secondary to-accent text-white text-lg md:text-xl font-bold rounded-full shadow-xl hover:scale-105 transition-all duration-300"
            >
              فهم القصة بالصوت
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-6 text-text-arabic text-base">
            اختر نوع التحدي الذي تريده بعد القصة!
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm">
      {/* Professional Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-warm/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-warm/20"
              >
                <ArrowRight className="w-4 h-4" />
                العودة
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-warm/20"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </Link>
            </div>
            
            {/* Story Title */}
            <div className="text-center flex-1 max-w-md mx-4">
              <h1 className="text-lg md:text-xl font-bold text-text-arabic truncate">
                {cleanChapterText(story.title)}
              </h1>
            </div>
            
            {/* Page Counter */}
            <div className="flex items-center gap-2 text-sm text-text-english/60">
              <BookOpen className="w-4 h-4" />
              <span>{currentPage + 1} من {story.pages.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-warm/30 overflow-hidden">
          {/* Story Container - Fixed Height */}
          <div className="min-h-[70vh] md:min-h-[75vh] flex flex-col lg:flex-row">
            {/* Left Side - Image */}
            <div className="lg:w-1/2 p-6 md:p-8 lg:p-12 flex items-center justify-center bg-gradient-to-br from-accent-light/30 to-warm-light/30">
              <div className="relative w-full max-w-md">
                <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-xl">
                  {currentPageData.imageUrl ? (
                    <Image
                      src={currentPageData.imageUrl}
                      alt="Story illustration"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                      priority
                      onError={(e) => {
                        console.error('Image failed to load:', currentPageData.imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent-light to-warm-light flex items-center justify-center">
                      <div className="text-center text-text-arabic/60">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-sm">جاري تحميل الصورة...</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="lg:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-center">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                {...({} as any)}
              >
                {/* Arabic Text */}
                <div className="min-h-[200px] md:min-h-[250px] flex flex-col justify-center overflow-hidden">
                  <div className={cn(
                    "arabic-text leading-relaxed text-text-arabic font-[Amiri,serif] text-center overflow-hidden",
                    currentPage === 0 
                      ? "text-2xl md:text-3xl lg:text-4xl font-bold" 
                      : "text-xl md:text-2xl lg:text-3xl font-semibold"
                  )} style={{ 
                    fontWeight: currentPage === 0 ? 800 : 600, 
                    letterSpacing: '-0.01em',
                    lineHeight: '1.8',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {cleanChapterText(currentPageData.arabicText)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                  <button
                    onClick={() => setShowTranslation(v => !v)}
                    className={cn(
                      "px-4 py-2 rounded-full font-medium shadow transition-all text-sm flex items-center gap-2 min-w-[140px] justify-center",
                      showTranslation 
                        ? "bg-blue-100 text-blue-800 border border-blue-200" 
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                      {showTranslation ? 'إخفاء الترجمة' : 'ترجمة'}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handlePlayAudio(currentPageData)}
                    disabled={isPlaying || isGeneratingAudio}
                    className={cn(
                      "px-4 py-2 rounded-full font-medium shadow transition-all text-sm flex items-center gap-2 min-w-[140px] justify-center",
                      isGeneratingAudio
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : isPlaying
                        ? "bg-green-500 text-white animate-pulse"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    )}
                  >
                    {isGeneratingAudio ? (
                      <EqualizerIcon />
                    ) : (
                      <Volume2 className={cn(isPlaying && "animate-pulse")}/>
                    )}
                    <span className="whitespace-nowrap">
                      {isGeneratingAudio
                        ? 'جاري إنشاء...'
                        : isPlaying
                        ? 'يتم التشغيل...'
                        : 'استمع'
                      }
                    </span>
                  </button>
                </div>
                
                {/* Audio Error Message */}
                {audioError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center"
                    {...({} as any)}
                  >
                    <p className="text-red-700 text-sm font-medium">
                      {audioError}
                    </p>
                  </motion.div>
                )}
                
                {/* English Translation */}
                {showTranslation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-4 p-4 bg-warm-light/60 rounded-xl border border-warm/30"
                    {...({} as any)}
                  >
                    <div className="english-text text-base md:text-lg text-text-english font-medium leading-relaxed">
                      {currentPageData.englishText
                        ? currentPageData.englishText
                        : 'Translating...'}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="bg-warm-light/40 border-t border-warm/20 p-4 md:p-6">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <button
                onClick={handlePrevPage}
                disabled={isFirstPage}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium",
                  isFirstPage
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-primary hover:bg-primary/10"
                )}
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>

              {/* Page Progress */}
              <div className="flex items-center gap-2">
                {story.pages.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentPage
                        ? "bg-primary scale-125"
                        : "bg-primary/30"
                    )}
                  />
                ))}
              </div>

              {/* Next/Finish Button */}
              {isLastPage ? (
                <button
                  onClick={() => setShowCompletion(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:scale-105 transition-all duration-300 text-sm font-bold shadow-lg"
                >
                  انتهت القصة
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNextPage}
                  className="inline-flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-full transition-all duration-300 text-sm font-medium"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 