'use client'

import { useState, useMemo } from 'react'
import type { Question } from '@/lib/types'

interface Props {
  questions: Question[]
  chapterLabel: string
}

export default function RedSheetMode({ questions, chapterLabel }: Props) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [allRevealed, setAllRevealed] = useState(false)

  const question = questions[index]

  // セグメント分解（テキスト + 隠しワード）
  const segments = useMemo(() => {
    if (!question) return []
    type Seg =
      | { type: 'text'; content: string }
      | { type: 'hidden'; word: string; idx: number }

    const result: Seg[] = []
    let remaining = question.answer
    let hiddenIdx = 0

    for (const blank of question.blanks) {
      const pos = remaining.indexOf(blank.word)
      if (pos === -1) { hiddenIdx++; continue }
      if (pos > 0) result.push({ type: 'text', content: remaining.slice(0, pos) })
      result.push({ type: 'hidden', word: blank.word, idx: hiddenIdx })
      remaining = remaining.slice(pos + blank.word.length)
      hiddenIdx++
    }
    if (remaining) result.push({ type: 'text', content: remaining })
    return result
  }, [question])

  const hiddenCount = segments.filter(s => s.type === 'hidden').length

  function toggleWord(idx: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleAll() {
    if (allRevealed) {
      setRevealed(new Set())
      setAllRevealed(false)
    } else {
      const all = new Set(segments.filter(s => s.type === 'hidden').map(s => (s as { idx: number }).idx))
      setRevealed(all)
      setAllRevealed(true)
    }
  }

  function goNext() {
    if (index < questions.length - 1) {
      setIndex(index + 1)
      setRevealed(new Set())
      setAllRevealed(false)
    }
  }

  function goPrev() {
    if (index > 0) {
      setIndex(index - 1)
      setRevealed(new Set())
      setAllRevealed(false)
    }
  }

  if (!question) {
    return <div className="text-center py-16 text-sm text-gray-400">問題データなし</div>
  }

  const revealedCount = revealed.size

  return (
    <div className="flex flex-col h-full">
      {/* 進捗バー */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {index + 1} / {questions.length}
        </span>
      </div>

      {/* 問題情報 */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-gray-400">{chapterLabel} · No.{question.no}</p>
        <p className="text-sm font-bold text-gray-700 mt-0.5">{question.title}</p>
      </div>

      {/* 本文（赤シート） */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 leading-[2.4] tracking-wide">
          {segments.map((seg, i) => {
            if (seg.type === 'text') {
              return <span key={i} className="whitespace-pre-wrap">{seg.content}</span>
            }
            const isRevealed = revealed.has(seg.idx)
            return (
              <button
                key={i}
                onClick={() => toggleWord(seg.idx)}
                className={`inline-flex items-center justify-center mx-0.5 px-1.5 py-0.5 rounded font-bold align-middle transition-all active:scale-95 ${
                  isRevealed
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-red-800 text-red-800 border border-red-900 select-none'
                }`}
                style={{ minWidth: `${seg.word.length * 1.0 + 0.5}em` }}
              >
                {isRevealed ? seg.word : '■'.repeat(Math.min(seg.word.length, 4))}
              </button>
            )
          })}
        </div>

        {/* ヒント */}
        <p className="text-xs text-gray-400 text-center mt-3">
          ■■■ をタップで表示 · {revealedCount}/{hiddenCount} 個表示中
        </p>
      </div>

      {/* ボタン */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-2">
        <button
          onClick={toggleAll}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
            allRevealed
              ? 'bg-gray-100 text-gray-600 active:bg-gray-200'
              : 'bg-red-50 text-red-700 border border-red-200 active:bg-red-100'
          }`}
        >
          {allRevealed ? '再度隠す' : 'すべて表示'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm disabled:opacity-30 active:bg-gray-50"
          >
            ← 前へ
          </button>
          <button
            onClick={goNext}
            disabled={index === questions.length - 1}
            className="flex-2 flex-grow py-3 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-30 active:bg-blue-700"
          >
            次へ →
          </button>
        </div>
      </div>
    </div>
  )
}
