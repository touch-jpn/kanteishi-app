'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'forgot'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? '/study'
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function reset() { setError(null); setMessage(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    reset()

    if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        setError('送信に失敗しました。メールアドレスを確認してください。')
      } else {
        setMessage('パスワードリセット用のメールを送信しました。メールをご確認ください。')
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('確認メールを送信しました。メールを確認してください。')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message === 'Email not confirmed') {
          setError('メールアドレスが未確認です。確認メールをご確認ください。')
        } else {
          setError('メールアドレスまたはパスワードが違います')
        }
      } else {
        router.push(returnTo)
      }
    }
    setLoading(false)
  }

  const modeLabel: Record<Mode, string> = {
    login:  'ログイン',
    signup: 'アカウント作成',
    forgot: 'パスワードをリセット',
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
          <h1 className="text-xl font-black text-gray-900">不動産鑑定士 暗記アプリ</h1>
          <p className="text-sm text-gray-400 mt-1">{modeLabel[mode]}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              placeholder="example@email.com"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">パスワード</label>
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
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {message && (
            <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm active:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '処理中...' : modeLabel[mode]}
          </button>
        </form>

        <div className="mt-4 space-y-1">
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('forgot'); reset() }}
                className="w-full text-center text-sm text-gray-400 py-2"
              >
                パスワードを忘れた方はこちら
              </button>
              <button
                onClick={() => { setMode('signup'); reset() }}
                className="w-full text-center text-sm text-gray-400 py-2"
              >
                アカウントをお持ちでない方はこちら
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button
              onClick={() => { setMode('login'); reset() }}
              className="w-full text-center text-sm text-gray-400 py-2"
            >
              ← ログインに戻る
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
