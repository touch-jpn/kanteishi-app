'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Supabase がリセットリンクを開くと PASSWORD_RECOVERY イベントが発火する
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('パスワードの更新に失敗しました。もう一度お試しください。')
    } else {
      setDone(true)
      setTimeout(() => router.push('/study'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-4">
          <a href="/" className="text-xs text-gray-400 flex items-center gap-1 active:text-gray-600">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            トップへ戻る
          </a>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-4">
            <span className="text-white text-lg font-black">鑑</span>
          </div>
          <h1 className="text-xl font-black text-gray-900">パスワードを再設定</h1>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-3">
            <p className="text-3xl">✅</p>
            <p className="font-bold text-gray-800">パスワードを更新しました</p>
            <p className="text-sm text-gray-400">ホームへ移動します...</p>
          </div>
        ) : !ready ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
            <p className="text-sm text-gray-500">
              メールに記載されたリンクからこのページを開いてください。
            </p>
            <a href="/login" className="text-sm text-blue-600 font-bold">
              ← ログインページへ
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">新しいパスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                placeholder="6文字以上"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">パスワード（確認）</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                placeholder="もう一度入力"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm active:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '更新中...' : 'パスワードを更新する'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
