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
    if (bookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id)
        .eq('question_slug', questionSlug)
      setBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, question_slug: questionSlug })
      setBookmarked(true)
    }
    setLoading(false)
  }

  return { bookmarked, toggle, loading }
}
