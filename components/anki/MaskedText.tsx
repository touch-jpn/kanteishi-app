'use client'

import { useMemo, useState } from 'react'
import { buildSegments, getMaskWords } from '@/lib/ankiMask'
import type { AnkiEntry, AnkiLevel } from '@/lib/ankiTypes'

interface Props {
  entry: AnkiEntry
  level: AnkiLevel
  /** 親から全表示を制御する場合（省略可） */
  forceRevealAll?: boolean
}

export default function MaskedText({ entry, level, forceRevealAll = false }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  // レベルに応じたマスク語一覧
  const maskWords = useMemo(
    () => getMaskWords(entry.level1, entry.level2, entry.level3, level),
    [entry.level1, entry.level2, entry.level3, level],
  )

  // テキストをセグメントに分解
  const segments = useMemo(
    () => buildSegments(entry.text, maskWords),
    [entry.text, maskWords],
  )

  const maskedSegs = useMemo(
    () => segments.filter(s => s.kind === 'masked'),
    [segments],
  )

  function toggle(segId: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(segId)) next.delete(segId)
      else next.add(segId)
      return next
    })
  }

  return (
    <div>
      <p className="text-[15px] leading-[2.1] tracking-wide text-gray-800 whitespace-pre-wrap">
        {segments.map((seg, i) => {
          if (seg.kind === 'text') {
            return <span key={i}>{seg.content}</span>
          }

          const isRevealed = forceRevealAll || revealed.has(seg.segId)
          // ■の数＝文字数（最大6個で視認性確保）
          const blocks = '■'.repeat(Math.min(seg.word.length, 6))

          return (
            <button
              key={i}
              onClick={() => toggle(seg.segId)}
              className={`
                inline-flex items-center justify-center
                mx-[2px] px-[3px] py-0
                rounded font-bold align-baseline leading-snug
                transition-all duration-150 active:scale-95
                ${isRevealed
                  ? 'bg-yellow-50 text-red-700 border border-yellow-300 underline decoration-dotted'
                  : 'bg-red-700 text-red-700 select-none border border-red-800'
                }
              `}
              style={{ minWidth: `${Math.min(seg.word.length, 6) * 0.9 + 0.3}em` }}
              aria-label={isRevealed ? seg.word : '隠れたキーワード'}
            >
              {isRevealed ? seg.word : blocks}
            </button>
          )
        })}
      </p>

      {/* マスク数インジケーター */}
      {maskedSegs.length > 0 && (
        <p className="mt-1 text-[11px] text-gray-400">
          {forceRevealAll
            ? `${maskedSegs.length} 語を表示中`
            : `${revealed.size}/${maskedSegs.length} 語 表示中 · タップで開示`
          }
        </p>
      )}
      {maskedSegs.length === 0 && (
        <p className="mt-1 text-[11px] text-gray-400">このレベルでは隠し語なし</p>
      )}
    </div>
  )
}
