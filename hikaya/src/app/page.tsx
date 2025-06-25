'use client'

import { motion } from 'framer-motion'
import { BookOpen, Star, Sparkles, Moon, Landmark, Sun, Book } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm overflow-hidden relative">
      {/* Animated Islamic/heritage background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating stars and sparkles */}
        <div className="absolute top-40 right-20 animate-sparkle">
          <Sparkles className="text-primary-light w-6 h-6 opacity-70" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
          <Star className="text-secondary w-6 h-6 opacity-50" />
        </div>
        <div className="absolute bottom-20 right-1/3 animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="text-accent w-4 h-4 opacity-80" />
        </div>
        {/* Crescent moon and palm tree */}
        <Moon className="absolute top-10 right-10 text-accent w-12 h-12 opacity-40" />
        {/* Palm tree SVG */}
        <svg className="absolute bottom-0 right-0 w-32 h-32 opacity-20" viewBox="0 0 64 64" fill="none">
          <path d="M32 60V38" stroke="#228B22" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 38C28 30 16 32 12 36" stroke="#228B22" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 38C36 30 48 32 52 36" stroke="#228B22" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 38C24 28 8 24 4 28" stroke="#228B22" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 38C40 28 56 24 60 28" stroke="#228B22" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
          {...({} as any)}
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-accent to-primary rounded-full mb-8 shadow-2xl border-2 border-accent relative">
              {/* Static Magical Lantern SVG */}
              <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
                <ellipse cx="40" cy="70" rx="18" ry="6" fill="#FFD700" opacity=".2" />
                <rect x="30" y="20" width="20" height="30" rx="10" fill="#FFD700" stroke="#8B4513" strokeWidth="3" />
                <ellipse cx="40" cy="35" rx="7" ry="10" fill="#FFF8DC" />
                <rect x="36" y="10" width="8" height="10" rx="4" fill="#8B4513" />
                <path d="M40 10 Q38 5 40 2 Q42 5 40 10" stroke="#FFD700" strokeWidth="2" fill="none" />
                <path d="M50 35 Q60 25 55 15" stroke="#FFD700" strokeWidth="2" fill="none" />
                <circle cx="60" cy="12" r="2" fill="#FFD700" />
                <path d="M60 12 Q62 8 66 10 Q62 14 60 12" stroke="#FFD700" strokeWidth="1" fill="none" />
                <path d="M20 40 Q10 30 20 20" stroke="#FFD700" strokeWidth="2" fill="none" />
                <path d="M20 20 Q18 18 16 22 Q18 24 20 20" stroke="#FFD700" strokeWidth="1" fill="none" />
                <path d="M70 40 Q75 35 70 30" stroke="#FFD700" strokeWidth="1.5" fill="none" />
                <path d="M70 30 Q72 28 74 32 Q72 34 70 30" stroke="#FFD700" strokeWidth="1" fill="none" />
                {/* Crescent */}
                <path d="M60 30 A10 10 0 1 1 50 20" stroke="#FFD700" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h1 className="text-7xl md:text-9xl font-extrabold text-text-arabic mb-2 tracking-tight drop-shadow-lg" style={{ fontFamily: 'Amiri, serif', letterSpacing: '-0.05em' }}>
              حكاية
            </h1>
            {/* <h2 className="text-3xl md:text-5xl font-bold text-text-english mb-4 tracking-tight drop-shadow-lg" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>
              Hikaya
            </h2> */}
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <p className="text-5xl md:text-4xl text-primary font-extrabold mb-2 drop-shadow-lg" style={{ fontFamily: 'Amiri, serif' }}>
              حكاية تفتح أبواب الخيال
            </p>
            <p className="text-2xl md:text-3xl text-text-english/70 italic font-bold">
              Stories that open doors to imagination
            </p>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-12"
          >
            <Link
              href="/setup"
              className={cn(
                "flex flex-col items-center justify-center px-10 py-5 bg-primary text-white rounded-full shadow-lg border-2 border-primary",
                "hover:scale-105 hover:shadow-xl transition-all duration-300",
                "focus:outline-none focus:ring-4 focus:ring-primary/30"
              )}
              style={{ fontFamily: 'Amiri, serif', minWidth: '270px' }}
            >
              <span className="font-extrabold text-2xl md:text-3xl mb-1">ابدأ مغامرتك الآن</span>
              <span className="text-base md:text-lg text-white/80 font-semibold">Start your adventure</span>
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-4 max-w-5xl mx-auto"
          >
            <div className="bg-[#FFF8DC] rounded-2xl p-8 shadow-md border border-accent flex flex-col items-center min-h-[220px] rotate-2">
              {/* BookOpen icon for interactive stories */}
              <BookOpen className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-2xl font-extrabold text-text-arabic mb-2" style={{ fontFamily: 'Amiri, serif', color: '#222' }}>قصص تفاعلية</h3>
              <p className="text-lg font-extrabold mb-1" style={{ color: '#333' }}>Interactive stories, quizzes, and illustrations</p>
            </div>
            <div className="bg-[#FDF6E3] rounded-2xl p-8 shadow-md border border-primary flex flex-col items-center min-h-[220px] -rotate-2">
              {/* Moon and Star for magical atmosphere */}
              <svg className="w-12 h-12 text-accent mb-3" viewBox="0 0 32 32" fill="none">
                <path d="M24 16A8 8 0 1 1 8 8c0 4.418 3.582 8 8 8z" fill="#FFD700" />
                <path d="M26 10l1 2 2 .5-1.5 1.5.5 2-2-1-2 1 .5-2L21 12l2-.5 1-2z" fill="#FFD700" />
              </svg>
              <h3 className="text-2xl font-extrabold text-text-arabic mb-2" style={{ fontFamily: 'Amiri, serif', color: '#222' }}>أجواء سحرية</h3>
              <p className="text-lg font-extrabold mb-1" style={{ color: '#333' }}>Magical, dreamy, and fun for all ages</p>
            </div>
            <div className="bg-[#F5E9D7] rounded-2xl p-8 shadow-md border border-primary flex flex-col items-center min-h-[220px] rotate-1">
              {/* Mosque dome SVG for Islamic heritage */}
              <svg className="w-12 h-12 text-primary mb-3" viewBox="0 0 32 32" fill="none">
                <path d="M16 6C12 12 4 14 4 22h24c0-8-8-10-12-16z" fill="#FFD700" stroke="#8B4513" strokeWidth="2" />
                <rect x="10" y="22" width="12" height="6" rx="2" fill="#8B4513" />
              </svg>
              <h3 className="text-2xl font-extrabold text-text-arabic mb-2" style={{ fontFamily: 'Amiri, serif', color: '#222' }}>تراث إسلامي</h3>
              <p className="text-lg font-extrabold mb-1" style={{ color: '#333' }}>Islamic heritage and culture in every story</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
