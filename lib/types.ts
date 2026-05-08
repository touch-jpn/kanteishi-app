export type Difficulty = 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'C'

export interface BlankWord {
  word: string
  position: number
}

export interface Question {
  id: string
  slug: string          // e.g. "souron-1-001"
  no: number
  chapter: string       // e.g. "総論1章"
  section: 'sōron' | 'kakuron'
  chapterNum: number
  title: string
  difficulty: Difficulty
  answer: string
  kaisetsu: string      // 解説（空欄可）
  keywords: { word: string; points: number }[]
  blanks: BlankWord[]
}

export interface StudyRecord {
  questionId: string
  answeredAt: string    // ISO date string
  score: number
  mode: 'blank' | 'free'
}

export interface SpacedRepetitionCard {
  questionId: string
  easeFactor: number    // SM-2: starts at 2.5
  interval: number      // days until next review
  repetitions: number
  nextReviewDate: string
  lastScore: number
}

export interface UserProgress {
  records: StudyRecord[]
  cards: SpacedRepetitionCard[]
}

export interface PremiumState {
  isPremium: boolean
  planType: 'trial' | 'monthly' | 'yearly' | null
  expiresAt: string | null  // YYYY-MM-DD
}

export interface QuestionMemo {
  questionId: string
  text: string
  updatedAt: string
}
