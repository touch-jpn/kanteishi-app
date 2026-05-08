'use client'

import { useState, useRef } from 'react'
import type { Question } from '@/lib/types'

interface Props {
  question: Question
  onSubmit: (answer: string) => void
}

export default function FreeMode({ question, onSubmit }: Props) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    if (!text.trim()) return
    setSubmitted(true)
    onSubmit(text)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-sm font-bold text-amber-800">問題</p>
        <p className="text-base text-gray-800 mt-1">{question.title}</p>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          基準の内容を入力してください
        </label>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={submitted}
          placeholder="ここに記述..."
          rows={10}
          className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none resize-none bg-white leading-relaxed"
          style={{ fontSize: '16px' }} /* Prevent iOS zoom on focus */
        />
        <p className="text-right text-xs text-gray-400 mt-1">{text.length}文字</p>
      </div>

      {/* Hint: show keyword count */}
      <div className="text-xs text-gray-400">
        💡 キーワード {question.keywords.length}個が採点対象（最大50点）
      </div>

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || submitted}
        className={`w-full py-4 rounded-2xl font-bold text-base ${
          text.trim() && !submitted
            ? 'bg-emerald-600 text-white active:bg-emerald-700'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        採点する
      </button>
    </div>
  )
}
