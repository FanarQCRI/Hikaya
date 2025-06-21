'use client'

import { motion } from 'framer-motion'
import { BookOpen, Star, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-float">
          <Star className="text-accent w-8 h-8 opacity-60" />
        </div>
        <div className="absolute top-40 right-20 animate-sparkle">
          <Sparkles className="text-primary-light w-6 h-6 opacity-70" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
          <Star className="text-secondary w-6 h-6 opacity-50" />
        </div>
        <div className="absolute bottom-20 right-1/3 animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="text-accent w-4 h-4 opacity-80" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-full mb-6 shadow-lg">
              <BookOpen className="text-white w-12 h-12" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-text-arabic mb-4">
              حكايات
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-text-english mb-2">
              Hikayat
            </h2>
            <p className="text-lg text-text-english/80 max-w-2xl mx-auto">
              Magical stories for children, inspired by Arabic and Islamic heritage
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <p className="text-xl md:text-2xl text-text-arabic font-medium mb-4">
              "حكايات تفتح أبواب الخيال"
            </p>
            <p className="text-lg text-text-english/70 italic">
              "Stories that open doors to imagination"
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-warm/20">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-text-arabic mb-2">قصص تفاعلية</h3>
              <p className="text-text-english/70 text-sm">Interactive stories with beautiful illustrations</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-warm/20">
              <div className="text-3xl mb-3">🎧</div>
              <h3 className="text-lg font-semibold text-text-arabic mb-2">صوت جميل</h3>
              <p className="text-text-english/70 text-sm">Beautiful audio narration for each story</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-warm/20">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-semibold text-text-arabic mb-2">تعلم ممتع</h3>
              <p className="text-text-english/70 text-sm">Fun learning with quizzes and rewards</p>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-8"
          >
            <Link
              href="/setup"
              className={cn(
                "inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light",
                "text-white font-semibold text-lg rounded-full shadow-lg",
                "transform transition-all duration-300 hover:scale-105 hover:shadow-xl",
                "focus:outline-none focus:ring-4 focus:ring-primary/30"
              )}
            >
              <BookOpen className="w-6 h-6" />
              ابدأ قصة جديدة
              <span className="text-sm opacity-90">Start a Story</span>
            </Link>
          </motion.div>

          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-center"
          >
            <p className="text-text-english/60 text-sm max-w-md mx-auto">
              Perfect for children ages 3-12 • Available in Arabic and English • 
              Safe and educational content
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-4 left-0 right-0 text-center"
      >
        <p className="text-text-english/50 text-sm">
          Made with ❤️ for children's education and cultural heritage
        </p>
      </motion.footer>
    </div>
  )
}
