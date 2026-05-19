'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface LearningStats {
  todayCount: number
  totalCount: number
  correctRate: number
  streak: number
  answerDates: string[]
}

const EMPTY: LearningStats = {
  todayCount: 0,
  totalCount: 0,
  correctRate: 0,
  streak: 0,
  answerDates: [],
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0
  const set = new Set(dates)

  // JST の今日・昨日を取得
  const jstOffset = 9 * 60 * 60 * 1000
  const nowJST = new Date(Date.now() + jstOffset)
  const today = nowJST.toISOString().slice(0, 10)

  const yesterdayJST = new Date(nowJST)
  yesterdayJST.setDate(yesterdayJST.getDate() - 1)
  const yesterday = yesterdayJST.toISOString().slice(0, 10)

  // 今日回答済みならtoday起点、未回答ならyesterday起点（streak継続判定）
  const startStr = set.has(today) ? today : set.has(yesterday) ? yesterday : null
  if (!startStr) return 0

  let streak = 0
  const cur = new Date(startStr + 'T00:00:00Z')
  while (true) {
    const d = cur.toISOString().slice(0, 10)
    if (!set.has(d)) break
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

export function useStats(user: User | null) {
  const [stats, setStats] = useState<LearningStats>(EMPTY)

  useEffect(() => {
    if (!user) { setStats(EMPTY); return }
    ;(async () => {
      const { data, error } = await supabase.rpc('get_my_stats')
      if (error || !data) return

      const todayCount  = data.today_count  ?? 0
      const totalCount  = data.total_count  ?? 0
      const correctRate = data.correct_rate ?? 0
      const dates       = (data.answer_dates ?? []) as string[]
      const streak      = calcStreak(dates)

      setStats({ todayCount, totalCount, correctRate, streak, answerDates: dates })
    })()
  }, [user])

  return stats
}
