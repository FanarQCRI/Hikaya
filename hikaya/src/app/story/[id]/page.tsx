'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Volume2, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Show completion screen if last page and showCompletion is true
  if (showCompletion && story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 text-center max-w-xl mx-auto"
        >
          <div className="mb-6 flex flex-col items-center">
            {/* Fallback emoji illustration instead of missing SVG */}
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
            <h1 className="text-3xl font-extrabold text-text-arabic mb-2">أحسنت! أنهيت القصة 🎉</h1>
            <p className="text-lg text-text-english/80 mb-4">Great job! You finished the story. Are you ready for a fun quiz?</p>
          </div>
          <button
            onClick={handleFinishStory}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-primary-light text-white text-2xl font-extrabold rounded-full shadow-xl hover:scale-105 transition-all duration-300 mb-4"
          >
            ابدأ الاختبار
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="mt-4 text-text-arabic text-base">اختبر معلوماتك حول القصة واكسب النقاط!</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm">
      {/* Header */}
      <div className="w-full px-4 py-4">
        <div className="flex justify-center pl-[1000px] pt-8">
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english mb-8 transition-colors text-lg font-medium"
          >
            العودة للصفحة السابقة
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      {/* Story Title (now below header, above content) */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-text-arabic mb-2">
          {cleanChapterText(story.title)}
        </h1>
      </div>

      {/* Story Content */}
      <div className="max-w-7xl mx-auto px-2 py-12">
        <div className="relative flex flex-col md:flex-row-reverse items-stretch bg-[#fdf6e3] rounded-[2.5rem] shadow-2xl border border-warm overflow-hidden min-h-[500px]">
          {/* Right page (text) */}
          <div className="flex-1 flex flex-col justify-center items-center px-10 py-14 md:py-20 md:pr-20 md:pl-14">
            <div className="space-y-6"><motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                {currentPage === 0 ? (
                  <div className="arabic-text text-4xl md:text-5xl leading-relaxed text-text-arabic font-[Amiri,serif] drop-shadow-md text-center font-bold" style={{ fontWeight: 800, letterSpacing: '-0.01em', maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {cleanChapterText(currentPageData.arabicText)}
                  </div>
                ) : (
                  <div className="arabic-text text-2xl md:text-3xl leading-relaxed text-text-arabic font-[Noto Sans Arabic,sans-serif] text-center" style={{ fontWeight: 600, letterSpacing: '-0.01em', maxWidth: '95%', wordBreak: 'break-word', overflowWrap: 'break-word', color: '#7c4a03' }}>
                    {cleanChapterText(currentPageData.arabicText)}
                  </div>
                )}
                {/* Real Translate and Listen buttons */}
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-14">
                  <button
                    onClick={() => setShowTranslation(v => !v)}
                    className="px-6 py-2 rounded-full bg-blue-200 text-blue-900 font-bold shadow hover:bg-blue-300 transition-all text-lg flex items-center gap-2"
                  >
                    <Globe className="w-5 h-5" />
                    {showTranslation ? 'إخفاء الترجمة' : 'ترجمة إلى الإنجليزية'}
                  </button>
                  <button
                    onClick={() => handlePlayAudio(currentPageData)}
                    disabled={isPlaying || isGeneratingAudio}
                    className={cn(
                      "px-6 py-2 rounded-full font-bold shadow transition-all text-lg flex items-center gap-2",
                      isGeneratingAudio
                        ? "bg-blue-400 text-white cursor-not-allowed"
                        : isPlaying
                        ? "bg-green-500 text-white animate-pulse"
                        : "bg-orange-400 text-white hover:bg-orange-500"
                    )}
                  >
                    {isGeneratingAudio ? (
                      <EqualizerIcon />
                    ) : (
                      <Volume2 className={cn(isPlaying && "animate-pulse")}/>
                    )}
                    {isGeneratingAudio
                      ? 'جاري إنشاء الصوت...'
                      : isPlaying
                      ? 'يتم التشغيل...'
                      : 'استمع للنص'
                    }
                  </button>
                </div>
                
                {/* Audio Error Message */}
                {audioError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center"
                  >
                    <p className="text-red-700 text-sm font-medium">
                      {audioError}
                    </p>
                  </motion.div>
                )}
                
                {/* Mock English translation */}
                {showTranslation && (
                  <div className="english-text text-lg md:text-xl bg-warm-light/60 p-4 rounded-xl mt-2 text-center font-semibold text-text-english" style={{ maxWidth: '95%', margin: '0 auto' }}>
                    {currentPageData.englishText
                      ? currentPageData.englishText
                      : 'Translating...'}
                  </div>
                )}
              </div>
            </motion.div></div>
          </div>
          {/* Center spine */}
          <div className="hidden md:block w-3 relative z-20">
            <div className="absolute left-1/2 top-0 h-full w-1 bg-gradient-to-b from-[#e2cfa1] via-[#fff8dc] to-[#e2cfa1] rounded-full shadow-lg opacity-80" style={{ filter: 'blur(1.5px)' }} />
          </div>
          {/* Left page (image) */}
          <div className="flex-1 flex flex-col justify-center items-center px-10 py-14 md:py-20 md:pl-20 md:pr-14">
            <div className="relative w-full max-w-sm flex justify-center items-center">
              <Image
                src={currentPageData.imageUrl}
                alt="Story illustration"
                width={400}
                height={300}
                className="rounded-2xl shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-warm-light/30 p-6 border-t border-warm/20">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={handlePrevPage}
              disabled={isFirstPage}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300",
                isFirstPage
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-primary hover:bg-primary/10"
              )}
            >
              {/* التالي */}
              <ChevronRight className="w-5 h-5" />
              السابق
              
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-2">
              {story.pages.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    index === currentPage
                      ? "bg-primary"
                      : "bg-primary/30"
                  )}
                />
              ))}
            </div>

            {/* Next/Finish Button */}
            {isLastPage ? (
              <button
                onClick={() => setShowCompletion(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:scale-105 transition-all duration-300 text-xl font-bold"
              >
                انتهت القصة
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleNextPage}
                className="inline-flex items-center gap-2 px-6 py-3 text-primary hover:bg-primary/10 rounded-full transition-all duration-300"
              >
                {/* السابق */}
                التالي
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 