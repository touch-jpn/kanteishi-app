'use client'

import { useState, useMemo, useRef } from 'react'
import type { Question } from '@/lib/types'

interface Props {
  question: Question
  onSubmit: (reconstructedAnswer: string) => void
}

function normalize(s: string) {
  return s.replace(/\s+/g, '').replace(/　/g, '').toLowerCase()
}

export default function BlankMode({ question, onSubmit }: Props) {
  const [inputs, setInputs] = useState<string[]>(question.blanks.map(() => ''))
  const [submitted, setSubmitted] = useState(false)
  const [checked, setChecked] = useState<boolean[] | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 文章をセグメントに分解
  const segments = useMemo(() => {
    type Seg = { type: 'text'; content: string } | { type: 'blank'; blankIdx: number; word: string }
    const result: Seg[] = []
    let remaining = question.answer
    let blankIdx = 0
    for (const blank of question.blanks) {
      const idx = remaining.indexOf(blank.word)
      if (idx === -1) { blankIdx++; continue }
      if (idx > 0) result.push({ type: 'text', content: remaining.slice(0, idx) })
      result.push({ type: 'blank', blankIdx, word: blank.word })
      remaining = remaining.slice(idx + blank.word.length)
      blankIdx++
    }
    if (remaining) result.push({ type: 'text', content: remaining })
    return result
  }, [question])

  function handleInput(idx: number, value: string) {
    const next = [...inputs]
    next[idx] = value
    setInputs(next)
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = inputRefs.current[idx + 1]
      if (next) next.focus()
      else handleSubmit()
    }
  }

  function handleSubmit() {
    if (submitted) return
    // 各入力が正解かチェック
    const results = question.blanks.map((b, i) => normalize(inputs[i]) === normalize(b.word))
    setChecked(results)
    setSubmitted(true)

    // 正解の単語で埋めた解答文字列を構築して採点へ
    let answer = question.answer
    question.blanks.forEach((b, i) => {
      if (!results[i]) {
        answer = answer.replace(b.word, `(誤:${inputs[i] || '未入力'})`)
      }
    })
    onSubmit(answer)
  }

  const allFilled = inputs.every(v => v.trim() !== '')

  return (
    <div className="p-5 space-y-5">
      {/* 問題文（穴あき） */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 leading-[2.2] tracking-wide">
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i} className="whitespace-pre-wrap">{seg.content}</span>
          }
          const idx = seg.blankIdx
          const isCorrect = checked ? checked[idx] : null
          return (
            <input
              key={i}
              ref={el => { inputRefs.current[idx] = el }}
              type="text"
              value={inputs[idx]}
              onChange={e => handleInput(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(e, idx)}
              disabled={submitted}
              placeholder="　　"
              className={`inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 text-sm font-bold transition-colors focus:outline-none align-middle ${
                isCorrect === null
                  ? 'border-blue-400 bg-white focus:border-blue-600 text-blue-800'
                  : isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-red-400 bg-red-50 text-red-600 line-through'
              }`}
              style={{
                width: `${Math.max(seg.word.length * 1.1 + 2, 4)}em`,
                fontSize: '14px',
              }}
            />
          )
        })}
      </div>

      {/* 採点後の正解表示 */}
      {submitted && checked && (
        <div className="space-y-2">
          {question.blanks.map((b, i) => (
            !checked[i] && (
              <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
                <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">✗</span>
                <div>
                  <span className="text-gray-500">入力：</span>
                  <span className="text-red-600 line-through">{inputs[i] || '（未入力）'}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-green-700 font-bold">正解：{b.word}</span>
                </div>
              </div>
            )
          ))}
          {checked.every(Boolean) && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-700 font-bold text-center">
              🎉 全問正解！
            </div>
          )}
        </div>
      )}

      {/* ヒント */}
      {!submitted && (
        <p className="text-xs text-gray-400 text-center">
          空欄をタップして入力 · Enter で次の空欄へ
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allFilled || submitted}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
          allFilled && !submitted
            ? 'bg-blue-600 text-white active:bg-blue-700'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        採点する
      </button>
    </div>
  )
}
