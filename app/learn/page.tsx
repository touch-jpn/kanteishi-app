'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Question } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const DIFFICULTY_LABEL: Record<number, { label: string; color: string }> = {
  5: { label: 'A+', color: 'bg-red-100 text-red-600' },
  4: { label: 'A',  color: 'bg-orange-100 text-orange-600' },
  3: { label: 'B+', color: 'bg-yellow-100 text-yellow-700' },
  2: { label: 'B',  color: 'bg-green-100 text-green-700' },
  1: { label: 'C',  color: 'bg-gray-100 text-gray-500' },
}

const CATEGORY_LABEL: Record<string, string> = {
  souron:  '総論',
  kakuron: '各論',
}

type Phase = 'question' | 'answer' | 'login_prompt' | 'done'

export default function LearnPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [phase, setPhase] = useState<Phase>('question')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [pendingAnswer, setPendingAnswer] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchQuestion = useCallback(async () => {
    setLoading(true)
    setPhase('question')
    setResult(null)
    setPendingAnswer(null)

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .limit(200)

    if (error || !data || data.length === 0) {
      setLoading(false)
      return
    }

    const randomIndex = Math.floor(Math.random() * data.length)
    setQuestion(data[randomIndex] as Question)
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuestion() }, [fetchQuestion])

  async function handleAnswer(isCorrect: boolean) {
    if (!question) return

    if (!user) {
      setPendingAnswer(isCorrect)
      setPhase('login_prompt')
      return
    }

    await saveLog(isCorrect)
  }

  async function saveLog(isCorrect: boolean) {
    if (!user || !question) return
    setSaving(true)
    await supabase.from('answer_logs').insert({
      user_id:     user.id,
      question_id: question.id,
      is_correct:  isCorrect,
    })
    setResult(isCorrect ? 'correct' : 'incorrect')
    setPhase('done')
    setSaving(false)
  }

  function handleSkip() {
    setResult(pendingAnswer ? 'correct' : 'incorrect')
    setPhase('done')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">問題が見つかりません</p>
      </div>
    )
  }

  const diff = DIFFICULTY_LABEL[question.difficulty] ?? { label: '?', color: 'bg-gray-100 text-gray-400' }
  const categoryLabel = CATEGORY_LABEL[question.category] ?? question.category

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 flex flex-col">

      {/* ── ヘッダー ── */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center"
          >
            <span className="text-white text-xs font-black">鑑</span>
          </button>
          <span className="text-sm font-black text-gray-800">学習モード</span>
        </div>
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ログアウト
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full"
          >
            ログイン
          </button>
        )}
      </header>

      {/* ── スクロールエリア（ボタン分の余白あり） ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">

        {/* 問題メタ情報 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500">{categoryLabel} 第{question.chapter}章</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
        </div>

        {/* 問題タイトル */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-2">問題</p>
          <p className="text-base font-bold text-gray-900 leading-snug">{question.title}</p>
        </div>

        {/* 解答・解説（答えを見た後） */}
        {(phase === 'answer' || phase === 'login_prompt' || phase === 'done') && (
          <>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 mb-2">解答</p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{question.answer}</p>
            </div>

            {question.explanation && (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-400 mb-1.5">解説</p>
                <p className="text-sm text-blue-900 leading-relaxed">{question.explanation}</p>
              </div>
            )}

            {/* ログイン促進プロンプト */}
            {phase === 'login_prompt' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-sm font-bold text-amber-800">記録するにはログインが必要です</p>
                  <p className="text-xs text-amber-600 mt-0.5">ログインすると正解/不正解の履歴が保存されます。</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSkip}
                    className="py-2.5 rounded-xl text-sm font-bold text-amber-600 border border-amber-200 bg-white active:bg-amber-50"
                  >
                    スキップ
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 active:bg-amber-600"
                  >
                    ログイン →
                  </button>
                </div>
              </div>
            )}

            {/* 記録完了 */}
            {phase === 'done' && (
              <div className={`rounded-2xl px-4 py-3 text-center font-bold text-sm ${
                result === 'correct'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-red-50 text-red-500 border border-red-200'
              }`}>
                {result === 'correct' ? '✅ 正解' : '❌ 不正解'}
                {!user && <span className="font-normal text-xs ml-1">（未記録）</span>}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── スティッキーフッター（アクションボタン） ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 px-4 py-3 z-20">
        {phase === 'question' && (
          <button
            onClick={() => setPhase('answer')}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-base active:bg-blue-700"
          >
            答えを見る
          </button>
        )}

        {phase === 'answer' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer(false)}
              disabled={saving}
              className="py-4 rounded-2xl font-bold text-sm bg-red-50 text-red-500 border border-red-200 active:bg-red-100 disabled:opacity-50"
            >
              不正解
            </button>
            <button
              onClick={() => handleAnswer(true)}
              disabled={saving}
              className="py-4 rounded-2xl font-bold text-sm bg-green-500 text-white active:bg-green-600 disabled:opacity-50"
            >
              正解
            </button>
          </div>
        )}

        {phase === 'done' && (
          <button
            onClick={fetchQuestion}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl text-base active:bg-gray-700"
          >
            次の問題へ →
          </button>
        )}

        {/* login_promptのときはスクロールエリア内にボタンを表示済みなのでフッターは空 */}
        {phase === 'login_prompt' && (
          <div className="h-1" />
        )}
      </div>
    </div>
  )
}
