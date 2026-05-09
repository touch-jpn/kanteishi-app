'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface LearningStats {
  todayCount: number
  totalCount: number
  correctRate: number
}

export function useStats(user: User | null) {
  const [stats, setStats] = useState<LearningStats>({ todayCount: 0, totalCount: 0, correctRate: 0 })

  useEffect(() => {
    if (!user) { setStats({ todayCount: 0, totalCount: 0, correctRate: 0 }); return }
    ;(async () => {
      const { data } = await supabase
        .from('answer_logs')
        .select('is_correct, created_at')
        .eq('user_id', user.id)
      if (!data || data.length === 0) return

      // Use JST date (UTC+9)
      const now = new Date()
      const jstOffset = 9 * 60 * 60 * 1000
      const todayJST = new Date(now.getTime() + jstOffset).toISOString().slice(0, 10)

      const todayCount = data.filter(r => {
        if (!r.created_at) return false
        const rowJST = new Date(new Date(r.created_at).getTime() + jstOffset).toISOString().slice(0, 10)
        return rowJST === todayJST
      }).length
      const totalCount = data.length
      const correctCount = data.filter(r => r.is_correct).length
      const correctRate = totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0

      setStats({ todayCount, totalCount, correctRate })
    })()
  }, [user])

  return stats
}
