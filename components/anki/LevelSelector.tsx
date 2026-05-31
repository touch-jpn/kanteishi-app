'use client'

import type { AnkiLevel } from '@/lib/ankiTypes'

interface Props {
  level: AnkiLevel
  onChange: (level: AnkiLevel) => void
}

const LEVELS: { value: AnkiLevel; label: string; desc: string }[] = [
  { value: 1, label: 'L1',  desc: '認識' },
  { value: 2, label: 'L2',  desc: '構造' },
  { value: 3, label: 'L3',  desc: '論文' },
]

export default function LevelSelector({ level, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {LEVELS.map(({ value, label, desc }) => {
        const active = level === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-xs font-bold transition-all ${
              active
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-gray-500 active:bg-gray-200'
            }`}
          >
            <span className="text-sm font-black">{label}</span>
            <span className={`text-[10px] font-normal ${active ? 'text-red-200' : 'text-gray-400'}`}>
              {desc}
            </span>
          </button>
        )
      })}
    </div>
  )
}
