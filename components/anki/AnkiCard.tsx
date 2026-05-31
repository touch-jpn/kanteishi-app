'use client'

import { useState } from 'react'
import MaskedText from './MaskedText'
import type { AnkiEntry, AnkiLevel } from '@/lib/ankiTypes'

interface Props {
  entry: AnkiEntry
  level: AnkiLevel
  index: number
}

const DIFF_COLORS: Record<1 | 2 | 3, string> = {
  1: 'text-emerald-600 bg-emerald-50',
  2: 'text-amber-600  bg-amber-50',
  3: 'text-red-600    bg-red-50',
}
const DIFF_DOTS: Record<1 | 2 | 3, string> = {
  1: '●○○',
  2: '●●○',
  3: '●●●',
}

export default function AnkiCard({ entry, level, index }: Props) {
  const [revealAll, setRevealAll] = useState(false)

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* カードヘッダー */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          {/* セクションバッジ */}
          <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
            #{String(index + 1).padStart(3, '0')}
          </span>
          <span className="text-xs text-blue-700 font-bold truncate">
            {entry.section}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 難易度 */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${DIFF_COLORS[entry.difficulty]}`}>
            {DIFF_DOTS[entry.difficulty]}
          </span>
          {/* 全表示トグル */}
          <button
            onClick={() => setRevealAll(v => !v)}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
              revealAll
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {revealAll ? '再隠す' : '全表示'}
          </button>
        </div>
      </div>

      {/* カテゴリーライン */}
      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[10px] text-gray-400">{entry.category}</span>
      </div>

      {/* 本文（赤シート） */}
      <div className="px-4 py-4">
        {/* level が変わったら再マウントして revealed リセット */}
        <MaskedText
          key={`${entry.id}-${level}`}
          entry={entry}
          level={level}
          forceRevealAll={revealAll}
        />
      </div>
    </article>
  )
}
