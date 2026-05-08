'use client'

import { useEffect, useRef } from 'react'
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
  isPremium: boolean
  user: User | null
  onRetry: () => void
  onNext: () => void
}

export default function ResultScreen({ question, result, mode, isPremium, user, onRetry, onNext }: Props) {
  const router = useRouter()
  const { total, keywordScore, similarityScore, matchedKeywords, similarityRate } = result
  const savedRef = useRef(false)

  // ログイン済みなら自動でSupabaseに保存
  useEffect(() => {
    if (!user || savedRef.current) return
    savedRef.current = true
    ;(async () => {
      const { data } = await supabase
        .from('questions')
        .select('id')
        .eq('slug', question.slug)
        .single()
      if (data) {
        await supabase.from('answer_logs').insert({
          user_id:     user.id,
          question_id: data.id,
          is_correct:  total >= 60,
        })
      }
    })()
  }, [user, question.slug, total])

  const scoreColor = total >= 80 ? 'text-green-600' : total >= 60 ? 'text-yellow-500' : 'text-red-500'
  const ringColor  = total >= 80 ? 'border-green-400' : total >= 60 ? 'border-yellow-400' : 'border-red-400'
  const scoreEmoji = total >= 80 ? '🎉' : total >= 60 ? '👍' : '💪'

  return (
    <div className="p-5 space-y-4 pb-8">
      {/* スコアリング */}
      <div className="flex items-center gap-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className={`w-20 h-20 rounded-full border-4 ${ringColor} flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`text-2xl font-extrabold leading-none ${scoreColor}`}>{total}</span>
          <span className="text-xs text-gray-400">点</span>
        </div>
        <div className="flex-1">
          <p className="text-xl mb-1">{scoreEmoji}</p>
          {mode === 'free' ? (
            <div className="space-y-0.5">
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
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {total >= 80 ? 'キーワードを正確に記入できました！' : total >= 60 ? 'もう少しです。もう一度確認しましょう' : '基準を読み直してから再チャレンジ'}
            </p>
          )}
        </div>
      </div>

      {/* 獲得キーワード */}
      {matchedKeywords.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">獲得キーワード</p>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map(kw => (
              <span key={kw} className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                ✓ {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 未獲得キーワード */}
      {question.keywords.filter(k => !matchedKeywords.includes(k.word)).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">未獲得キーワード</p>
          <div className="flex flex-wrap gap-1.5">
            {question.keywords
              .filter(k => !matchedKeywords.includes(k.word))
              .map(k => (
                <span key={k.word} className="bg-red-50 text-red-500 text-xs px-2.5 py-1 rounded-full font-medium border border-red-200">
                  {k.word}（{k.points}点）
                </span>
              ))}
          </div>
        </div>
      )}

      {/* 模範解答 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">模範解答（基準）</p>
        <p className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">{question.answer}</p>
      </div>

      {/* ログイン促進（未ログイン時） */}
      {!user && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 font-medium">ログインして学習記録を保存できます</p>
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

      {/* SM-2 メッセージ */}
      <p className="text-xs text-gray-400 text-center">
        {total >= 80 ? '✨ 次回の復習は数日後に設定されました' : total >= 60 ? '📅 次回の復習は明後日以降' : '🔄 明日また復習します'}
      </p>

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
