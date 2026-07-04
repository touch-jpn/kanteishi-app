'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const CATEGORIES = [
  { value: 'bug',     label: '🐛 不具合報告' },
  { value: 'request', label: '💡 改善要望' },
  { value: 'typo',    label: '✏️ 誤字・内容の誤り' },
  { value: 'other',   label: '💬 その他' },
] as const

type Category = typeof CATEGORIES[number]['value']

export default function FeedbackPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [category, setCategory] = useState<Category>('bug')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !message.trim()) return
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('feedback').insert({
      user_id:  user.id,
      category,
      message:  message.trim(),
    })

    if (err) {
      setError('送信に失敗しました。もう一度お試しください。')
      console.error('[feedback] insert failed:', err.message)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  // 送信完了
  if (done) {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="text-5xl">🙏</div>
        <div>
          <p className="text-lg font-black text-gray-900">送信しました！</p>
          <p className="text-sm text-gray-500 mt-1">フィードバックありがとうございます。<br />サービス改善に活かします。</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl text-sm active:bg-blue-700"
        >
          トップへ戻る
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <a href="/" className="text-gray-500 p-1 -ml-1 active:text-gray-700" aria-label="ホームへ">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <p className="text-sm font-bold text-gray-800">フィードバック</p>
      </header>

      <main className="px-4 py-6 space-y-4">

        {/* 未ログイン */}
        {!user ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-2xl">🔒</p>
            <p className="font-bold text-amber-800">ログインが必要です</p>
            <p className="text-sm text-amber-600">フィードバックの送信にはログインが必要です。</p>
            <button
              onClick={() => router.push('/login?returnTo=/feedback')}
              className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm active:bg-amber-600"
            >
              ログイン →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700">
                β版の改善にご協力ください。不具合・要望・誤字など何でもお気軽にどうぞ。
              </p>
            </div>

            {/* カテゴリ */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
              <label className="text-xs font-bold text-gray-500">種類</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold text-left transition-colors ${
                      category === c.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 active:bg-gray-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* メッセージ */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
              <label className="text-xs font-bold text-gray-500">
                内容 <span className="font-normal text-gray-400">（1000文字以内）</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                maxLength={1000}
                rows={5}
                placeholder="例：○○の問題の解答に誤りがあります。正しくは〜"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400"
              />
              <p className="text-xs text-gray-300 text-right">{message.length} / 1000</p>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-sm active:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
