'use client'

import { useState } from 'react'
import { chapterTexts } from '@/lib/chapterTexts'
import { formatChapterText } from '@/lib/formatText'

interface Props {
  chapterKey: string
  chapterLabel: string
}

type SubTab = 'kijun' | 'kiji'

export default function ReferenceView({ chapterKey, chapterLabel }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('kijun')
  const data = chapterTexts[chapterKey] ?? { kijun: '', kiji: '' }
  const hasKiji = data.kiji.trim().length > 0

  const kijunFormatted = formatChapterText(data.kijun)
  const kijiFormatted  = formatChapterText(data.kiji)

  return (
    <div className="flex flex-col">
      {/* サブタブ */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setSubTab('kijun')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            subTab === 'kijun'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-400'
          }`}
        >
          基　準
        </button>
        <button
          onClick={() => setSubTab('kiji')}
          disabled={!hasKiji}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            subTab === 'kiji'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : hasKiji ? 'text-gray-400' : 'text-gray-200'
          }`}
        >
          留意事項{!hasKiji && <span className="text-xs font-normal ml-1">（なし）</span>}
        </button>
      </div>

      {/* 本文 */}
      <div className="px-4 py-5 pb-24">
        {subTab === 'kijun' && (
          <>
            <p className="text-xs text-gray-400 mb-4">不動産鑑定評価基準 · {chapterLabel}</p>
            {kijunFormatted ? (
              <p className="text-sm text-gray-800 leading-[1.95] whitespace-pre-wrap tracking-wide">
                {kijunFormatted}
              </p>
            ) : (
              <p className="text-center text-gray-300 py-16 text-sm">テキストデータなし</p>
            )}
          </>
        )}

        {subTab === 'kiji' && (
          <>
            <p className="text-xs text-gray-400 mb-4">留意事項 · {chapterLabel}</p>
            {kijiFormatted ? (
              <p className="text-sm text-gray-800 leading-[1.95] whitespace-pre-wrap tracking-wide">
                {kijiFormatted}
              </p>
            ) : (
              <p className="text-center text-gray-300 py-16 text-sm">留意事項なし</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
