'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Volume2, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Story, StoryPage } from '@/types'
import { HikayatAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function StoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [showEnglish, setShowEnglish] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load story from localStorage (in a real app, you'd fetch from API)
    const storyData = localStorage.getItem('currentStory')
    if (storyData) {
      const parsedStory = JSON.parse(storyData)
      setStory(parsedStory)
    }
    setIsLoading(false)
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-warm/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة
            </Link>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-text-arabic">{story.title}</h1>
              <p className="text-sm text-text-english/70">
                صفحة {currentPage + 1} من {story.pages.length}
              </p>
            </div>

            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Page Content */}
          <div className="relative min-h-[600px] flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="w-full md:w-1/2 p-8 flex items-center justify-center bg-gradient-to-br from-accent-light to-warm-light">
              <div className="relative w-full max-w-sm">
                <Image
                  src={currentPageData.imageUrl}
                  alt="Story illustration"
                  width={400}
                  height={300}
                  className="rounded-2xl shadow-lg w-full h-auto"
                />
              </div>
            </div>

            {/* Text Section */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Arabic Text */}
                  <div className="space-y-4">
                    <div className="arabic-text text-2xl md:text-3xl leading-relaxed text-text-arabic">
                      {currentPageData.arabicText}
                    </div>

                    {/* English Translation Toggle */}
                    <button
                      onClick={() => setShowEnglish(!showEnglish)}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-light transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      {showEnglish ? 'إخفاء الترجمة' : 'عرض الترجمة'}
                    </button>

                    {/* English Text */}
                    <AnimatePresence>
                      {showEnglish && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="english-text text-lg text-text-english/80 bg-warm-light/50 p-4 rounded-lg"
                        >
                          {currentPageData.englishText}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Audio Button */}
                  <button
                    onClick={() => handlePlayAudio(currentPageData)}
                    disabled={isPlayingAudio}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                      isPlayingAudio
                        ? "bg-primary-light text-white"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <Volume2 className={cn("w-5 h-5", isPlayingAudio && "animate-pulse")} />
                    {isPlayingAudio ? 'جاري التشغيل...' : 'استماع'}
                  </button>
                </motion.div>
              </AnimatePresence>
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
                <ChevronLeft className="w-5 h-5" />
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
                  onClick={handleFinishStory}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:scale-105 transition-all duration-300"
                >
                  انتهت القصة
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNextPage}
                  className="inline-flex items-center gap-2 px-6 py-3 text-primary hover:bg-primary/10 rounded-full transition-all duration-300"
                >
                  التالي
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 