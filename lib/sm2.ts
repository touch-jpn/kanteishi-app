'use client'

import type { SpacedRepetitionCard } from './types'

// SM-2 algorithm: score 0-5 based on 0-100 point scale
function scoreToGrade(score: number): number {
  if (score >= 90) return 5
  if (score >= 80) return 4
  if (score >= 70) return 3
  if (score >= 60) return 2
  if (score >= 40) return 1
  return 0
}

export function updateCard(
  card: SpacedRepetitionCard,
  score: number
): SpacedRepetitionCard {
  const grade = scoreToGrade(score)
  let { easeFactor, interval, repetitions } = card

  if (grade >= 3) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // Incorrect: reset
    repetitions = 0
    interval = 1
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
  )

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextDate.toISOString().split('T')[0],
    lastScore: score,
  }
}

export function createCard(questionId: string): SpacedRepetitionCard {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    questionId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: tomorrow.toISOString().split('T')[0],
    lastScore: 0,
  }
}

export function isDueToday(card: SpacedRepetitionCard): boolean {
  const today = new Date().toISOString().split('T')[0]
  return card.nextReviewDate <= today
}
