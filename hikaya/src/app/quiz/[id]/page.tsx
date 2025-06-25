'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Trophy, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Story, Question } from '@/types'
import { HikayatAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import React from 'react'

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const [story, setStory] = useState<Story | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Load story from localStorage
        const storyData = localStorage.getItem('currentStory')
        if (storyData) {
          const parsedStory = JSON.parse(storyData)
          setStory(parsedStory)
          // Try to load quiz from localStorage
          const quizKey = `currentQuiz-${parsedStory.id}`
          const savedQuiz = localStorage.getItem(quizKey)
          if (savedQuiz) {
            const quizQuestions = JSON.parse(savedQuiz)
            setQuestions(quizQuestions)
            setLoadError(!quizQuestions || quizQuestions.length === 0)
          } else {
            // Generate quiz questions
            const storyContent = parsedStory.pages.map((page: any) => page.arabicText)
            const quizQuestions = await HikayatAPI.generateQuiz(parsedStory.id, storyContent)
            setQuestions(quizQuestions)
            if (!quizQuestions || quizQuestions.length === 0) {
              setLoadError(true)
            } else {
              setLoadError(false)
              localStorage.setItem(quizKey, JSON.stringify(quizQuestions))
            }
          }
        } else {
          setLoadError(true)
        }
      } catch (error) {
        console.error('Error loading quiz:', error)
        setLoadError(true)
      }
      setIsLoading(false)
    }
    loadQuiz()
  }, [])

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    if (isCorrect) {
      setScore(prev => prev + currentQuestion.points)
    }

    setIsAnswered(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setShowResults(true)
    }
  }

  const handlePlayAgain = () => {
    router.push('/setup')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-arabic text-lg">جاري تحضير الأسئلة...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-arabic text-lg mb-4">لم يتم العثور على الأسئلة</p>
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

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  if (showResults) {
    const totalPossibleScore = questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = Math.round((score / totalPossibleScore) * 100)
    const isExcellent = percentage >= 80
    const isGood = percentage >= 60

    // Add retake and return handlers
    const handleRetakeQuiz = () => {
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setScore(0)
      setShowResults(false)
    }
    const handleReturnToStory = () => {
      if (story) router.push(`/story/${story.id}`)
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center"
          >
            {/* Trophy Icon */}
            <div className="mb-6">
              <div className={cn(
                "inline-flex items-center justify-center w-24 h-24 rounded-full mb-4",
                isExcellent ? "bg-gradient-to-br from-accent to-accent-light" : 
                isGood ? "bg-gradient-to-br from-secondary to-green-400" : 
                "bg-gradient-to-br from-primary to-primary-light"
              )}>
                <Trophy className="text-white w-12 h-12" />
              </div>
            </div>

            {/* Results */}
            <h1 className="text-3xl font-bold text-text-arabic mb-4">
              مبروك! انتهيت من الاختبار
            </h1>
            <p className="text-xl text-text-english/80 mb-6">
              Congratulations! You completed the quiz
            </p>

            {/* Score */}
            <div className="bg-warm-light/50 rounded-2xl p-6 mb-8">
              <div className="text-4xl font-bold text-primary mb-2">{score}</div>
              <div className="text-lg text-text-english/70 mb-2">من {totalPossibleScore} نقطة</div>
              <div className="text-2xl font-semibold text-text-arabic">
                {isExcellent ? 'ممتاز!' : isGood ? 'جيد جداً!' : 'أحسنت!'}
              </div>
            </div>

            {/* Performance Message */}
            <div className="mb-8">
              <p className="text-lg text-text-english/80">
                {isExcellent 
                  ? "You did an amazing job! You really understood the story well."
                  : isGood 
                  ? "Great work! You understood most of the story."
                  : "Good effort! Keep reading and learning more stories."
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetakeQuiz}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:scale-105 transition-all duration-300"
              >
                إعادة الاختبار
                <Star className="w-5 h-5" />
              </button>
              <button
                onClick={handleReturnToStory}
                className="inline-flex items-center gap-2 px-8 py-4 bg-warm-light/50 text-text-arabic rounded-full hover:bg-warm-light transition-all duration-300"
              >
                العودة إلى القصة
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-warm-light/50 text-text-arabic rounded-full hover:bg-warm-light transition-all duration-300"
              >
                العودة للصفحة الرئيسية
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-warm/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 text-text-english/70 hover:text-text-english transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة
            </Link>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-text-arabic">اختبار القصة</h1>
              <p className="text-sm text-text-english/70">
                سؤال {currentQuestionIndex + 1} من {totalQuestions}
              </p>
            </div>

            <div className="text-right">
              <div className="text-lg font-semibold text-primary">{score}</div>
              <div className="text-xs text-text-english/70">نقطة</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-warm-light/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8"
        >
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-text-arabic mb-4 leading-relaxed">
              {currentQuestion.arabicText}
            </h2>
            <p className="text-lg text-text-english/70 italic">
              {currentQuestion.englishText}
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = isAnswered && index === currentQuestion.correctAnswer
              const isWrong = isAnswered && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all duration-300 text-right",
                    "hover:scale-[1.02] disabled:hover:scale-100",
                    isSelected && !isAnswered && "border-primary bg-primary/10",
                    isCorrect && "border-green-500 bg-green-50",
                    isWrong && "border-red-500 bg-red-50",
                    !isSelected && !isAnswered && "border-warm/30 bg-white/60 hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isAnswered && (
                        <>
                          {isCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                          {isWrong && <XCircle className="w-6 h-6 text-red-500" />}
                        </>
                      )}
                      <span className="text-lg font-semibold text-text-arabic">{option}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-warm-light/50 flex items-center justify-center text-sm font-semibold text-text-arabic">
                      {String.fromCharCode(65 + index)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className={cn(
                  "px-8 py-4 rounded-full font-semibold transition-all duration-300",
                  selectedAnswer !== null
                    ? "bg-gradient-to-r from-primary to-primary-light text-white hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                تحقق من الإجابة
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-8 py-4 bg-gradient-to-r from-secondary to-green-400 text-white rounded-full font-semibold hover:scale-105 transition-all duration-300"
              >
                {currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'انظر النتائج'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 