export interface StoryConfig {
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  theme: string
  customKeyword?: string
}

export interface StoryPage {
  id: string
  arabicText: string
  englishText: string
  imageUrl: string
  audioUrl?: string
  pageNumber: number
}

export interface Story {
  id: string
  title: string
  config: StoryConfig
  pages: StoryPage[]
  totalPages: number
  createdAt: Date
}

export interface Question {
  id: string
  arabicText: string
  englishText: string
  options: string[]
  correctAnswer: number
  points: number
}

export interface Quiz {
  id: string
  storyId: string
  questions: Question[]
  totalPoints: number
  completed: boolean
}

export interface UserProgress {
  totalStories: number
  totalPoints: number
  completedQuizzes: number
}

export type ThemeOption = {
  id: string
  name: string
  arabicName: string
  icon: string
  description: string
} 