'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface LearningStats {
  todayCount: number
  totalCount: number
  correctRate: number
}

const EMPTY: LearningStats = { todayCount: 0, totalCount: 0, correctRate: 0 }

export function useStats(user: User | null) {
  const [stats, setStats] = useState<LearningStats>(EMPTY)

  useEffect(() => {
    if (!user) { setStats(EMPTY); return }
    ;(async () => {
      const { data, error } = await supabase.rpc('get_my_stats')
      if (error || !data) return
      setStats({
        todayCount:  data.today_count   ?? 0,
        totalCount:  data.total_count   ?? 0,
        correctRate: data.correct_rate  ?? 0,
      })
    })()
  }, [user])

  return stats
}
