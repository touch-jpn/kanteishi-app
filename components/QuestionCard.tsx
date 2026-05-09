'use client'

import type { Question } from '@/lib/types'

const difficultyColor: Record<string, string> = {
  'A+': 'bg-red-100 text-red-600',
  'A':  'bg-orange-100 text-orange-600',
  'B+': 'bg-yellow-100 text-yellow-700',
  'B':  'bg-green-100 text-green-700',
  'B-': 'bg-blue-100 text-blue-600',
  'C':  'bg-gray-100 text-gray-500',
}

interface Props {
  question: Question
  stats: { attempts: number; avgScore: number; bestScore: number }
  onStart: () => void
}

export default function QuestionCard({ question, stats, onStart }: Props) {
  const hasStudied = stats.attempts > 0
  const score = stats.avgScore
  const scoreColor =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500'
  const barColor =
    score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <button
      onClick={onStart}
      className="w-full bg-white rounded-xl px-4 py-3.5 text-left border border-gray-200 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* 左：番号 */}
        <span className="flex-shrink-0 text-xs font-mono text-gray-300 pt-0.5 w-8">
          {question.no}
        </span>

        {/* 中央：タイトル + バッジ */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-snug">{question.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${difficultyColor[question.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
              {question.difficulty}
            </span>
            {hasStudied && (
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* 右：スコア */}
        <div className="flex-shrink-0 text-right">
          {hasStudied ? (
            <>
              <p className={`text-base font-extrabold leading-none ${scoreColor}`}>{score}</p>
              <p className="text-xs text-gray-300 mt-0.5">{stats.attempts}回</p>
            </>
          ) : (
            <span className="text-xs font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">未</span>
          )}
        </div>
      </div>
    </button>
  )
}
