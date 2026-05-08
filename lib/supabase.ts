'use client'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export type Question = {
  id: number
  slug: string
  category: string
  chapter: number
  question_type: string
  title: string
  answer: string
  explanation: string | null
  difficulty: number
}

export type AnswerLog = {
  user_id: string
  question_id: number
  is_correct: boolean
}
