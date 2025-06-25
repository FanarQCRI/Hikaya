'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Star, Sparkles, Moon, Sun, Heart, BookMarked, Wand2, Sparkles as SparklesIcon } from 'lucide-react'

interface LoadingOverlayProps {
  isVisible: boolean
  theme?: string
}

export default function LoadingOverlay({ isVisible, theme }: LoadingOverlayProps) {
  const [currentFact, setCurrentFact] = useState('')
  const [factIndex, setFactIndex] = useState(0)
  const [loadingStep, setLoadingStep] = useState(0)

  // Pre-defined Arabic facts for immediate display
  const fallbackFacts = [
    "١. القصص تساعد الأطفال على تطوير خيالهم وإبداعهم",
    "٢. القراءة اليومية تحسن مهارات اللغة العربية لدى الأطفال",
    "٣. القصص الإسلامية تعلم الأطفال القيم والأخلاق الحميدة",
    "٤. اللغة العربية هي لغة القرآن الكريم والتراث الإسلامي",
    "٥. القصص التفاعلية تجعل التعلم أكثر متعة وفعالية"
  ]

  // Loading steps with Arabic text
  const loadingSteps = [
    "جاري إعداد القصة...",
    "جاري إنشاء الشخصيات...",
    "جاري رسم الصور...",
    "جاري إضافة الأصوات...",
    "جاري تجهيز المغامرة..."
  ]

  // Fetch facts from Fanar API
  useEffect(() => {
    if (!isVisible) return

    const fetchFact = async () => {
      try {
        const response = await fetch('/api/generate-facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: theme ? [theme] : [] })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.facts) {
            setCurrentFact(data.facts)
          }
        }
      } catch (error) {
        console.log('Using fallback facts')
      }
    }

    // Use fallback facts immediately, then try to fetch from API
    setCurrentFact(fallbackFacts[factIndex])
    fetchFact()

    let intervalId: NodeJS.Timeout | null = null;
    if (isVisible) {
      intervalId = setInterval(() => {
        setFactIndex(prev => {
          const next = (prev + 1) % fallbackFacts.length;
          setCurrentFact(fallbackFacts[next]);
          return next;
        });
      }, 10000); // 10 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVisible, theme]);

  // Loading step animation
  useEffect(() => {
    if (!isVisible) return

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingSteps.length)
    }, 3500)

    return () => clearInterval(stepInterval)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-warm-light via-accent-light to-warm"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Books */}
            <motion.div
              animate={{ 
                y: [-20, 20, -20],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 left-20"
            >
              <BookOpen className="text-primary w-12 h-12 opacity-60" />
            </motion.div>

            <motion.div
              animate={{ 
                y: [20, -20, 20],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-32 right-32"
            >
              <BookMarked className="text-accent w-10 h-10 opacity-70" />
            </motion.div>

            {/* Floating Stars */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-32 left-32"
            >
              <Star className="text-accent w-8 h-8" />
            </motion.div>

            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [1, 0.5, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-20 right-20"
            >
              <Sparkles className="text-primary w-9 h-9" />
            </motion.div>

            {/* Moon and Sun */}
            <motion.div
              animate={{ 
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-10 right-10"
            >
              <Moon className="text-primary-light w-6 h-6 opacity-50" />
            </motion.div>

            <motion.div
              animate={{ 
                rotate: [360, 0]
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-10 left-10"
            >
              <Sun className="text-accent w-7 h-7 opacity-60" />
            </motion.div>

            {/* Magic Wand */}
            <motion.div
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
              className="absolute top-1/2 left-10"
            >
              <Wand2 className="text-accent w-8 h-8 opacity-70" />
            </motion.div>

            {/* Sparkles */}
            <motion.div
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
              className="absolute top-1/3 right-16"
            >
              <SparklesIcon className="text-primary w-6 h-6" />
            </motion.div>
          </div>

          {/* Main Loading Content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
            {/* Title */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-text-arabic mb-3 animate-pulse" style={{ fontFamily: 'Amiri, serif' }}>
                جاري إنشاء قصة سحرية
              </h1>
              <p className="text-xl text-text-english/80 font-semibold">
                Creating a magical story...
              </p>
            </motion.div>

            {/* Loading Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <div className="relative">
                {/* Main Spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-24 h-24 mx-auto mb-6"
                >
                  <div className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-shimmer" />
                </motion.div>

                {/* Inner Book Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <BookOpen className="text-primary w-12 h-12" />
                </motion.div>

                {/* Orbiting Sparkles */}
                <motion.div
                  animate={{ 
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Sparkles className="text-accent w-4 h-4" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <Star className="text-primary w-3 h-3" />
                  </div>
                  <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Sparkles className="text-accent w-3 h-3" />
                  </div>
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <Star className="text-primary w-4 h-4" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Loading Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={loadingStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-lg font-semibold text-text-arabic animate-bounce"
                  style={{ fontFamily: 'Amiri, serif' }}
                >
                  {loadingSteps[loadingStep]}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Progress Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex justify-center gap-2 mb-8"
            >
              {loadingSteps.map((_, index) => (
                <motion.div
                  key={index}
                  animate={{ 
                    scale: loadingStep === index ? 1.2 : 1,
                    opacity: loadingStep === index ? 1 : 0.5
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-3 h-3 bg-primary rounded-full"
                />
              ))}
            </motion.div>

            {/* Fun Facts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="bg-white/80 rounded-2xl p-6 shadow-lg border border-primary/20"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className="text-primary w-6 h-6 animate-pulse" />
                <h3 className="text-lg font-bold text-text-arabic" style={{ fontFamily: 'Amiri, serif' }}>
                  هل تعلم؟
                </h3>
                <Heart className="text-primary w-6 h-6 animate-pulse" />
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={factIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-base text-text-arabic leading-relaxed"
                  style={{ fontFamily: 'Amiri, serif' }}
                >
                  {currentFact}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Encouraging Message */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-6"
            >
              <p className="text-sm text-text-english/70 italic animate-wiggle">
                "Patience is the key to magical stories..."
              </p>
            </motion.div> */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 