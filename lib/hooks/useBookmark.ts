'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useBookmark(questionSlug: string, user: User | null) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setBookmarked(false); return }
    ;(async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('question_slug', questionSlug)
        .maybeSingle()
      setBookmarked(!!data)
    })()
  }, [user, questionSlug])

  async function toggle() {
    if (!user || loading) return
    setLoading(true)
    try {
      if (bookmarked) {
        const { error } = await supabase.from('bookmarks').delete()
          .eq('user_id', user.id)
          .eq('question_slug', questionSlug)
        if (error) throw error
        setBookmarked(false)
      } else {
        const { error } = await supabase.from('bookmarks')
          .insert({ user_id: user.id, question_slug: questionSlug })
        if (error) throw error
        setBookmarked(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[bookmark] toggle failed:', msg)
    } finally {
      setLoading(false)
    }
  }

  return { bookmarked, toggle, loading }
}
