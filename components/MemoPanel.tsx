'use client'

import { useState, useEffect } from 'react'
import { getMemo, saveMemo } from '@/lib/storage'

interface Props {
  questionId: string
}

export default function MemoPanel({ questionId }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setText(getMemo(questionId))
  }, [questionId])

  function handleSave() {
    saveMemo(questionId, text)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const hasMemo = text.trim().length > 0

  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 active:bg-gray-100 text-left"
      >
        <span className="text-sm font-medium text-gray-700">
          📝 メモ{hasMemo ? <span className="ml-1 text-xs text-blue-600 font-bold">（記入済）</span> : ''}
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {open && (
        <div className="p-3 space-y-2 bg-white">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="覚えにくい点、補足、語呂合わせなど..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:border-blue-400 focus:outline-none leading-relaxed"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-white active:bg-gray-900'
            }`}
          >
            {saved ? '✅ 保存しました' : '保存する'}
          </button>
        </div>
      )}
    </div>
  )
}
