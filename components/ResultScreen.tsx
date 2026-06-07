'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/lib/types'
import type { scoreAnswer } from '@/lib/scoring'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import MemoPanel from './MemoPanel'

interface Props {
  question: Question
  result: ReturnType<typeof scoreAnswer>
  mode: 'blank' | 'free'
  userAnswer: string
  isPremium: boolean
  user: User | null
  onRetry: () => void
  onNext: () => void
}

// 模範解答テキスト中の「不足キーワード」を赤くハイライトする
function HighlightedAnswer({
  text,
  missedWords,
}: {
  text: string
  missedWords: string[]
}) {
  if (missedWords.length === 0) {
    return <p className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">{text}</p>
  }

  type Seg = { text: string; missed: boolean }
  let segs: Seg[] = [{ text, missed: false }]

  // 長い語句を先にマッチさせて誤検知を防ぐ
  const sorted = [...missedWords].sort((a, b) => b.length - a.length)
  for (const word of sorted) {
    const next: Seg[] = []
    for (const seg of segs) {
      if (seg.missed) { next.push(seg); continue }
      const parts = seg.text.split(word)
      parts.forEach((part, i) => {
        if (part) next.push({ text: part, missed: false })
        if (i < parts.length - 1) next.push({ text: word, missed: true })
      })
    }
    segs = next
  }

  return (
    <p className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">
      {segs.map((seg, i) =>
        seg.missed ? (
          <mark
            key={i}
            className="bg-red-100 text-red-700 font-bold rounded-sm px-0.5 not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  )
}

export default function ResultScreen({
  question,
  result,
  mode,
  userAnswer,
  isPremium,
  user,
  onRetry,
  onNext,
}: Props) {
  const router = useRouter()
  const { total, keywordScore, similarityScore, matchedKeywords, similarityRate } = result
  const savedRef = useRef(false)
  const [addedToReview, setAddedToReview] = useState(false)
  const [weakKeywords, setWeakKeywords] = useState<{ word: string; count: number }[]>([])

  const missedKeywords = question.keywords.filter(k => !matchedKeywords.includes(k.word))
  const missedWords    = missedKeywords.map(k => k.word)

  // ── Supabaseに保存（拡張版：回答内容・スコア・不足キーワードも記録） ──
  useEffect(() => {
    if (!user || savedRef.current) return
    savedRef.current = true
    ;(async () => {
      const { error } = await supabase.from('answer_logs').insert({
        user_id:         user.id,
        question_slug:   question.slug,
        is_correct:      total >= 60,
        score:           total,
        user_answer:     userAnswer,
        missed_keywords: missedWords,
      })
      if (error) console.error('[answer_logs] insert failed:', error.message)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ── 苦手キーワード集計（過去100件の missed_keywords を集計） ──
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('answer_logs')
        .select('missed_keywords')
        .eq('user_id', user.id)
        .not('missed_keywords', 'is', null)
        .limit(100)

      if (!data) return
      const counts: Record<string, number> = {}
      data.forEach(row => {
        const arr: string[] = row.missed_keywords ?? []
        arr.forEach(kw => { counts[kw] = (counts[kw] ?? 0) + 1 })
      })
      setWeakKeywords(
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([word, count]) => ({ word, count }))
      )
    })()
  }, [user])

  async function addToReviewQueue() {
    if (!user || addedToReview) return
    const jstOffset = 9 * 60 * 60 * 1000
    const tomorrow  = new Date(Date.now() + jstOffset)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const reviewDate = tomorrow.toISOString().slice(0, 10)
    const { error } = await supabase.from('review_queue').insert({
      user_id:       user.id,
      question_slug: question.slug,
      review_date:   reviewDate,
    })
    if (!error) setAddedToReview(true)
    else console.error('[review_queue] insert failed:', error.message)
  }

  const scoreColor = total >= 80 ? 'text-green-600' : total >= 60 ? 'text-yellow-500' : 'text-red-500'
  const ringColor  = total >= 80 ? 'border-green-400' : total >= 60 ? 'border-yellow-400' : 'border-red-400'

  return (
    <div className="p-5 space-y-4 pb-10">

      {/* ① スコアカード */}
      <div className="flex items-center gap-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className={`w-20 h-20 rounded-full border-4 ${ringColor} flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`text-2xl font-extrabold leading-none ${scoreColor}`}>{total}</span>
          <span className="text-xs text-gray-400">点</span>
        </div>
        <div className="flex-1 space-y-1">
          {mode === 'free' ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">キーワード</span>
                <span className="font-bold text-gray-700">{keywordScore} 点</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">文章一致</span>
                <span className="font-bold text-gray-700">{similarityScore} 点</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">類似度</span>
                <span className="font-bold text-gray-700">{Math.round(similarityRate * 100)} %</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              {total >= 80
                ? '🎉 キーワードを正確に記入できました！'
                : total >= 60
                ? '👍 もう少しです。見直しましょう'
                : '💪 基準を読み直して再チャレンジ'}
            </p>
          )}
        </div>
      </div>

      {/* ② あなたの回答 */}
      {userAnswer && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
            あなたの回答
            {mode === 'blank' && (
              <span className="ml-1 normal-case font-normal text-gray-300">（穴埋め再現）</span>
            )}
          </p>
          <p className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">{userAnswer}</p>
        </div>
      )}

      {/* ③ 模範解答（不足語句をハイライト） */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">模範解答（基準）</p>
          {missedWords.length > 0 && (
            <span className="text-xs text-red-400 font-medium">赤字＝抜けた語句</span>
          )}
        </div>
        <HighlightedAnswer text={question.answer} missedWords={missedWords} />
      </div>

      {/* ④ 不足キーワード */}
      {missedKeywords.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-red-500 mb-2 tracking-wide">
            不足キーワード　{missedKeywords.length}個
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missedKeywords.map(k => (
              <span
                key={k.word}
                className="bg-white text-red-600 text-xs px-2.5 py-1 rounded-full font-bold border border-red-200"
              >
                {k.word}
                <span className="text-red-300 font-normal ml-0.5">（{k.points}点）</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-red-300 mt-2">次回は必ずこれらを書けるようにしましょう</p>
        </div>
      )}

      {/* 獲得キーワード */}
      {matchedKeywords.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">獲得キーワード</p>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map(kw => (
              <span
                key={kw}
                className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium border border-green-200"
              >
                ✓ {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ⑤ あなたの苦手キーワード（ログイン時・過去データあり） */}
      {user && weakKeywords.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-amber-600 mb-1 tracking-wide">
            📊 あなたがよく落とすキーワード
          </p>
          <p className="text-xs text-amber-400 mb-2">過去の回答履歴から集計</p>
          <div className="flex flex-wrap gap-1.5">
            {weakKeywords.map(({ word, count }) => (
              <span
                key={word}
                className="bg-white text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-200"
              >
                {word}
                <span className="text-amber-400 font-normal ml-0.5">（{count}回）</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ログイン促進（未ログイン） */}
      {!user && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 font-medium">
            ログインすると苦手キーワードを記録・分析できます
          </p>
          <button
            onClick={() => router.push('/login?returnTo=/study')}
            className="text-xs font-bold text-amber-600 ml-3 flex-shrink-0"
          >
            ログイン →
          </button>
        </div>
      )}

      {/* メモ（プレミアム） */}
      {isPremium && <MemoPanel questionId={question.id} />}

      {/* ⑥ 復習登録 */}
      {user && (
        <button
          onClick={addToReviewQueue}
          disabled={addedToReview}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
            addedToReview
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-gray-50 text-gray-500 border border-gray-200 active:bg-gray-100'
          }`}
        >
          {addedToReview ? '✅ 明日の復習リストに追加しました' : '📅 明日また復習する'}
        </button>
      )}

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold active:bg-gray-50 text-sm"
        >
          もう一度
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-700 text-sm"
        >
          次へ →
        </button>
      </div>
    </div>
  )
}
