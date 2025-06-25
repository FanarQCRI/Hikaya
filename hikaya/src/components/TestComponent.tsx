'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TestComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg",
        "flex items-center gap-2"
      )}
      {...({} as any)}
    >
      <Star className="w-5 h-5" />
      <span>All dependencies working! ✨</span>
    </motion.div>
  )
} 