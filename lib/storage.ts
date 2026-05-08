'use client'

import type { UserProgress, StudyRecord, SpacedRepetitionCard, QuestionMemo } from './types'
import { createCard, updateCard } from './sm2'

const STORAGE_KEY = 'kanteishi_progress'
const MEMO_KEY = 'kanteishi_memos'

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return { records: [], cards: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { records: [], cards: [] }
  } catch {
    return { records: [], cards: [] }
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function recordStudy(
  questionId: string,
  score: number,
  mode: 'blank' | 'free'
): void {
  const progress = loadProgress()

  const record: StudyRecord = {
    questionId,
    answeredAt: new Date().toISOString(),
    score,
    mode,
  }
  progress.records.push(record)

  const cardIndex = progress.cards.findIndex(c => c.questionId === questionId)
  if (cardIndex >= 0) {
    progress.cards[cardIndex] = updateCard(progress.cards[cardIndex], score)
  } else {
    const newCard = createCard(questionId)
    progress.cards.push(updateCard(newCard, score))
  }

  saveProgress(progress)
}

export function getQuestionStats(questionId: string): {
  attempts: number
  avgScore: number
  bestScore: number
  card: SpacedRepetitionCard | null
} {
  const progress = loadProgress()
  const records = progress.records.filter(r => r.questionId === questionId)
  const card = progress.cards.find(c => c.questionId === questionId) ?? null

  if (records.length === 0) {
    return { attempts: 0, avgScore: 0, bestScore: 0, card }
  }

  const scores = records.map(r => r.score)
  return {
    attempts: records.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
    card,
  }
}

export function getDueQuestions(questionIds: string[]): string[] {
  const progress = loadProgress()
  const today = new Date().toISOString().split('T')[0]
  return questionIds.filter(id => {
    const card = progress.cards.find(c => c.questionId === id)
    if (!card) return false
    return card.nextReviewDate <= today
  })
}

// おすすめ問題: SM-2期限 + 弱点 + 未学習 を優先順に返す
export function getRecommendedQuestions(
  allIds: string[]
): { dueIds: string[]; weakIds: string[]; newIds: string[] } {
  const progress = loadProgress()
  const today = new Date().toISOString().split('T')[0]

  const studiedIds = new Set(progress.cards.map(c => c.questionId))

  const dueIds: string[] = []
  const weakIds: string[] = []
  const newIds: string[] = []

  for (const id of allIds) {
    if (!studiedIds.has(id)) {
      newIds.push(id)
      continue
    }
    const card = progress.cards.find(c => c.questionId === id)!
    if (card.nextReviewDate <= today) {
      dueIds.push(id)
    } else {
      // 平均スコアが60未満なら弱点
      const records = progress.records.filter(r => r.questionId === id)
      if (records.length > 0) {
        const avg = records.reduce((s, r) => s + r.score, 0) / records.length
        if (avg < 60) weakIds.push(id)
      }
    }
  }

  return { dueIds, weakIds, newIds }
}

// ── メモ機能 ─────────────────────────────────────────────────

function loadMemos(): QuestionMemo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MEMO_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMemos(memos: QuestionMemo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos))
}

export function getMemo(questionId: string): string {
  return loadMemos().find(m => m.questionId === questionId)?.text ?? ''
}

export function saveMemo(questionId: string, text: string): void {
  const memos = loadMemos()
  const idx = memos.findIndex(m => m.questionId === questionId)
  const entry: QuestionMemo = { questionId, text, updatedAt: new Date().toISOString() }
  if (idx >= 0) {
    memos[idx] = entry
  } else {
    memos.push(entry)
  }
  saveMemos(memos)
}
