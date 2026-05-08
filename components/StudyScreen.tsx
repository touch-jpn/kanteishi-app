'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/lib/types'
import { scoreAnswer } from '@/lib/scoring'
import { recordStudy } from '@/lib/storage'
import BlankMode from './BlankMode'
import FreeMode from './FreeMode'
import ResultScreen from './ResultScreen'
import PremiumGate from './PremiumGate'
import type { User } from '@supabase/supabase-js'

type StudyMode = 'select' | 'blank' | 'free' | 'result' | 'premium-gate'

interface Props {
  question: Question
  onBack: () => void
  queueInfo?: { current: number; total: number }
  isPremium: boolean
  user: User | null
}

export default function StudyScreen({ question, onBack, queueInfo, isPremium, user }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<StudyMode>('select')
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null)
  const [activeMode, setActiveMode] = useState<'blank' | 'free'>('blank')

  const handleSubmit = useCallback(
    (userAnswer: string, m: 'blank' | 'free') => {
      const r = scoreAnswer({
        userAnswer,
        correctAnswer: question.answer,
        keywords: question.keywords,
      })
      setResult(r)
      setActiveMode(m)
      recordStudy(question.id, r.total, m)
      setMode('result')
    },
    [question]
  )

  function handleSelectMode(m: 'blank' | 'free') {
    if (m === 'free' && !isPremium) {
      setMode('premium-gate')
      return
    }
    setMode(m)
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-3 h-14 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="text-gray-500 active:text-gray-700 p-1 -ml-1"
          aria-label="戻る"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">{question.chapter} · No.{question.no}</p>
          <p className="text-sm font-bold text-gray-800 truncate leading-tight">{question.title}</p>
        </div>
        {queueInfo && (
          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 flex-shrink-0 font-medium">
            {queueInfo.current} / {queueInfo.total}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {mode === 'select' && (
          <ModeSelect onSelect={handleSelectMode} isPremium={isPremium} />
        )}
        {mode === 'blank' && (
          <BlankMode question={question} onSubmit={ans => handleSubmit(ans, 'blank')} />
        )}
        {mode === 'free' && (
          <FreeMode question={question} onSubmit={ans => handleSubmit(ans, 'free')} />
        )}
        {mode === 'premium-gate' && (
          <PremiumGate
            feature="全文入力モード"
            onUpgrade={() => router.push('/premium')}
            onBack={() => setMode('select')}
          />
        )}
        {mode === 'result' && result && (
          <ResultScreen
            question={question}
            result={result}
            mode={activeMode}
            isPremium={isPremium}
            user={user}
            onRetry={() => setMode('select')}
            onNext={onBack}
          />
        )}
      </div>
    </div>
  )
}

function ModeSelect({
  onSelect,
  isPremium,
}: {
  onSelect: (m: 'blank' | 'free') => void
  isPremium: boolean
}) {
  return (
    <div className="p-5 space-y-3 pt-8">
      <h2 className="text-base font-bold text-gray-700 mb-4">学習モードを選択</h2>

      {/* 穴埋め */}
      <button
        onClick={() => onSelect('blank')}
        className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left active:bg-gray-50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
            📝
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">穴埋めモード</p>
            <p className="text-sm text-gray-500 mt-0.5">空欄にキーワードを手入力する</p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2.5 py-1 rounded-full">無料</span>
        </div>
      </button>

      {/* 全文入力 */}
      <button
        onClick={() => onSelect('free')}
        className={`w-full rounded-2xl p-5 text-left transition-colors shadow-sm ${
          isPremium
            ? 'bg-white border border-gray-200 active:bg-gray-50'
            : 'bg-gray-50 border border-dashed border-gray-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            isPremium ? 'bg-emerald-100' : 'bg-gray-200'
          }`}>
            {isPremium ? '✍️' : '🔒'}
          </div>
          <div className="flex-1">
            <p className={`font-bold ${isPremium ? 'text-gray-800' : 'text-gray-400'}`}>全文入力モード</p>
            <p className={`text-sm mt-0.5 ${isPremium ? 'text-gray-500' : 'text-gray-400'}`}>
              基準を自由に入力して採点する
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isPremium
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-600'
          }`}>
            {isPremium ? 'PRO' : '⭐ PRO'}
          </span>
        </div>
      </button>
    </div>
  )
}
