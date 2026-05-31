'use client'

/**
 * 赤シートモード — 電子参考書ビューア
 *
 * 【設計思想】
 * 「問題を解く」のではなく「参考書に赤シートを載せる」感覚。
 * 本文は一切変更せず、マスク定義（maskData.ts）だけで
 * どの語を隠すかを制御する。
 *
 * 問題DB・次へ/前へ・スコア表示 は一切使わない。
 */

import { useState, useMemo, useCallback } from 'react'
import { chapterTexts } from '@/lib/chapterTexts'
import { formatChapterText } from '@/lib/formatText'
import { buildSegments } from '@/lib/ankiMask'
import { maskData, maskExcludes } from '@/lib/maskData'
import type { TextSegment } from '@/lib/ankiTypes'

// ──────────────────────────────────────
type Level  = 1 | 2 | 3
type SubTab = 'kijun' | 'kiji'

interface Props {
  chapterKey:   string
  chapterLabel: string
  /** 旧APIとの互換ダミー — 使用しない */
  questions?: unknown[]
}

// ──────────────────────────────────────
// マスク語をレベル別に分解
// ──────────────────────────────────────
function buildLevelWords(key: string) {
  const entries = maskData[key] ?? []
  const l1: string[] = []
  const l2: string[] = []
  const l3: string[] = []
  for (const e of entries) {
    if      (e.level === 1) l1.push(e.target)
    else if (e.level === 2) l2.push(e.target)
    else                    l3.push(e.target)
  }
  return { l1, l2, l3 }
}

// 累積マスク語を返す（L2 = L1+L2, L3 = 全語）
function getMaskWords(l1: string[], l2: string[], l3: string[], level: Level): string[] {
  if (level === 1) return l1
  if (level === 2) return [...l1, ...l2]
  return [...l1, ...l2, ...l3]
}

// ■の個数（最大7文字）
function maskChars(word: string): string {
  return '■'.repeat(Math.min(word.length, 7))
}

// ──────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────
export default function RedSheetMode({ chapterKey, chapterLabel }: Props) {
  const [level,    setLevel]    = useState<Level>(2)
  const [subTab,   setSubTab]   = useState<SubTab>('kijun')
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  // ── テキスト ──────────────────────────
  const data    = chapterTexts[chapterKey] ?? { kijun: '', kiji: '' }
  const hasKiji = data.kiji.trim().length > 0
  const rawText = subTab === 'kijun' ? data.kijun : data.kiji
  const fullText = useMemo(() => formatChapterText(rawText), [rawText])

  // ── マスク定義 ────────────────────────
  const { l1, l2, l3 } = useMemo(() => buildLevelWords(chapterKey), [chapterKey])
  const hasMasks = l1.length + l2.length + l3.length > 0

  const maskWords    = useMemo(() => getMaskWords(l1, l2, l3, level), [l1, l2, l3, level])
  const excludeWords = useMemo(() => maskExcludes[chapterKey] ?? [], [chapterKey])

  // ── セグメント ────────────────────────
  const segments: TextSegment[] = useMemo(
    () => buildSegments(fullText, maskWords, excludeWords),
    [fullText, maskWords, excludeWords],
  )

  // マスクセグメントだけ抽出
  const maskedSegs = useMemo(
    () => segments.filter(
      (s): s is { kind: 'masked'; word: string; segId: number } => s.kind === 'masked',
    ),
    [segments],
  )

  const maskedCount   = maskedSegs.length
  const revealedCount = maskedSegs.filter(s => revealed.has(s.segId)).length
  const allShown      = maskedCount > 0 && revealedCount === maskedCount

  // ── ハンドラ ──────────────────────────
  const toggle = useCallback((segId: number) => {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(segId)) next.delete(segId)
      else next.add(segId)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (allShown) {
      setRevealed(new Set())
    } else {
      setRevealed(new Set(maskedSegs.map(s => s.segId)))
    }
  }, [allShown, maskedSegs])

  function changeLevel(l: Level) {
    setLevel(l)
    setRevealed(new Set())
  }

  function changeSubTab(t: SubTab) {
    setSubTab(t)
    setRevealed(new Set())
  }

  // ──────────────────────────────────────
  // レンダリング
  // ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ──── コントロールバー ──── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2
                      flex items-center gap-2 flex-shrink-0">

        {/* レベルセレクター */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
          {([1, 2, 3] as Level[]).map(l => (
            <button
              key={l}
              onClick={() => changeLevel(l)}
              className={`px-2.5 py-1 rounded-[5px] text-xs font-bold transition-all ${
                level === l
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-gray-500 active:bg-white/70'
              }`}
            >
              L{l}
            </button>
          ))}
        </div>

        {/* マスク語数 */}
        <span className="text-[11px] text-gray-400 flex-1">
          {maskedCount > 0
            ? `${maskedCount}語隠中`
            : hasMasks
              ? <span className="text-gray-300">このレベルは該当なし</span>
              : <span className="text-gray-300">マスク未設定</span>
          }
        </span>

        {/* 全表示 / 全隠す */}
        {maskedCount > 0 && (
          <button
            onClick={toggleAll}
            className="text-[11px] font-bold text-red-700 active:opacity-50 px-1 py-1 flex-shrink-0"
          >
            {allShown ? '全隠す' : '全表示'}
          </button>
        )}
      </div>

      {/* ──── 基準 / 留意事項 タブ ──── */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={() => changeSubTab('kijun')}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            subTab === 'kijun'
              ? 'text-red-700 border-b-2 border-red-700'
              : 'text-gray-400 active:text-gray-600'
          }`}
        >
          基　準
        </button>
        <button
          onClick={() => changeSubTab('kiji')}
          disabled={!hasKiji}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            subTab === 'kiji'
              ? 'text-red-700 border-b-2 border-red-700'
              : hasKiji
                ? 'text-gray-400 active:text-gray-600'
                : 'text-gray-200'
          }`}
        >
          留意事項
          {!hasKiji && <span className="text-xs font-normal ml-1">（なし）</span>}
        </button>
      </div>

      {/* ──── 本文スクロール ──── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 pb-28">

          {/* メタ情報 */}
          <p className="text-[11px] text-gray-400 mb-5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>不動産鑑定評価基準 · {chapterLabel}</span>
            {maskedCount > 0 && (
              <span className="text-red-400 font-medium">
                {level === 1 ? 'L1｜最重要語のみ' : level === 2 ? 'L2｜重要語を隠す' : 'L3｜ほぼ全語を隠す'}
              </span>
            )}
          </p>

          {/* 本文 */}
          {fullText ? (
            <div className="text-[15px] text-gray-800 leading-[2.15] tracking-wide">
              {segments.map((seg, i) => {

                /* ── 通常テキスト ── */
                if (seg.kind === 'text') {
                  return (
                    <span key={i} className="whitespace-pre-wrap">
                      {seg.content}
                    </span>
                  )
                }

                /* ── マスクボタン ── */
                const isRevealed = revealed.has(seg.segId)
                return (
                  <button
                    key={i}
                    onClick={() => toggle(seg.segId)}
                    className={[
                      // レイアウト — インラインで行間を壊さない
                      'inline-block align-baseline',
                      'mx-[1px] px-[3px] py-0',
                      'rounded-[3px]',
                      // アニメーション
                      'transition-colors duration-100',
                      'active:opacity-60',
                      // 状態別色
                      isRevealed
                        ? 'bg-amber-50 text-red-700'
                        : 'bg-red-700 text-red-700 select-none',
                    ].join(' ')}
                    // フォントサイズ・行高は親から継承
                    style={{ fontSize: 'inherit', lineHeight: '1.25' }}
                    aria-label={isRevealed ? seg.word : `マスク語`}
                  >
                    {isRevealed ? seg.word : maskChars(seg.word)}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-300 py-20 text-sm">
              テキストデータなし
            </p>
          )}

          {/* 初回ヒント — マスクがある & まだ何も開示していない */}
          {maskedCount > 0 && revealedCount === 0 && (
            <p className="text-[11px] text-gray-300 text-center mt-10">
              ■■■ をタップすると語句が表示されます
            </p>
          )}

          {/* マスク未設定チャプターの案内 */}
          {!hasMasks && fullText && (
            <p className="text-[11px] text-gray-300 text-center mt-10">
              このチャプターのマスク定義は準備中です
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
