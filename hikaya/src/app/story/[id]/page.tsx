'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Volume2, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Story, StoryPage } from '@/types'
import { HikayatAPI, fetchStoryTranslationsInBackground } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getStoryFromIndexedDB } from '@/lib/utils'
import React from 'react'

// Utility to clean section markers and special characters from story text
function cleanSectionText(text: string) {
  // Remove any leading marker (with or without brackets), colons, asterisks, dashes, or whitespace, e.g. [Chapter 1]:**, [الفصل 1]:**, Title:**, etc.
  return text
    .replace(/^\s*(\[.*?\]|Title|العنوان|Chapter ?\d+|الفصل ?\d+)[\s:：\-*]*\**\s*/i, '') // Remove leading marker and all special chars after
    .replace(/^[\s:：\-*]+|[\s:：\-*]+$/g, '') // Remove any remaining leading/trailing special chars
    .trim();
}

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

  const handleNextPage = () => {
    if (story && currentPage < story.pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      setShowEnglish(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      setShowEnglish(false)
    }
  }

  const handlePlayAudio = async (page: StoryPage) => {
    if (!page.audioUrl) {
      // Mock audio play - in real app, you'd use the actual audio URL
      setIsPlayingAudio(true)
      setTimeout(() => setIsPlayingAudio(false), 3000)
      return
    }

    setIsPlayingAudio(true)
    // Here you would play the actual audio
    setTimeout(() => setIsPlayingAudio(false), 3000)
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
          {cleanSectionText(story.title)}
        </h1>
      </div>

      {/* Story Content */}
      <div className="max-w-7xl mx-auto px-2 py-12">
        <div className="relative flex flex-col md:flex-row-reverse items-stretch bg-[#fdf6e3] rounded-[2.5rem] shadow-2xl border border-warm overflow-hidden min-h-[500px]">
          {/* Right page (text) */}
          <div className="flex-1 flex flex-col justify-center items-center px-10 py-14 md:py-20 md:pr-20 md:pl-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                {...({} as any)}
              >
                <div className="space-y-4">
                  {currentPage === 0 ? (
                    <div className="arabic-text text-4xl md:text-5xl leading-relaxed text-text-arabic font-[Amiri,serif] drop-shadow-md text-center font-bold" style={{ fontWeight: 800, letterSpacing: '-0.01em', maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {cleanSectionText(currentPageData.arabicText)}
                    </div>
                  ) : (
                    <div className="arabic-text text-2xl md:text-3xl leading-relaxed text-text-arabic font-[Noto Sans Arabic,sans-serif] text-center" style={{ fontWeight: 600, letterSpacing: '-0.01em', maxWidth: '95%', wordBreak: 'break-word', overflowWrap: 'break-word', color: '#7c4a03' }}>
                      {cleanSectionText(currentPageData.arabicText)}
                    </div>
                  )}
                  {/* Mock Translate and Listen buttons */}
                  <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-14">
                    <button
                      onClick={() => setShowTranslation(v => !v)}
                      className="px-6 py-2 rounded-full bg-blue-200 text-blue-900 font-bold shadow hover:bg-blue-300 transition-all text-lg flex items-center gap-2"
                    >
                      <Globe className="w-5 h-5" />
                      {showTranslation ? 'إخفاء الترجمة' : 'ترجمة إلى الإنجليزية'}
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(true);
                        setTimeout(() => setIsPlaying(false), 2000);
                      }}
                      className="px-6 py-2 rounded-full bg-orange-400 text-white font-bold shadow hover:bg-orange-500 transition-all text-lg flex items-center gap-2"
                    >
                      <Volume2 className={isPlaying ? 'animate-pulse' : ''} />
                      {isPlaying ? 'يتم التشغيل...' : 'استمع للنص'}
                    </button>
                  </div>
                  {/* Mock English translation */}
                  {showTranslation && (
                    <div className="english-text text-lg md:text-xl bg-warm-light/60 p-4 rounded-xl mt-2 text-center font-semibold text-text-english" style={{ maxWidth: '95%', margin: '0 auto' }}>
                      {currentPageData.englishText
                        ? currentPageData.englishText
                        : 'Translating...'}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
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