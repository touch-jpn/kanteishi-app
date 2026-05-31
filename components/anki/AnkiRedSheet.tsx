'use client'

/**
 * 鑑定評価基準ビューア
 *
 * 【設計思想】
 * 問題アプリではなく「暗記用電子参考書」。
 * 主役は基準全文。赤シートは脇役（語句を隠すだけ）。
 *
 * ─ カードUI         → なし
 * ─ 次へ/前へ        → なし
 * ─ 問題タイトル     → なし
 * ─ 表示数カウント   → なし
 * ─ 全表示ボタン     → なし（タップ個別開示のみ）
 *
 * データソース:
 *   本文   → lib/chapterTexts.ts （原文そのまま）
 *   マスク → lib/maskData.ts     （問題DBと無関係）
 */

import { useState, useMemo, useCallback } from 'react'
import { chapterList } from '@/lib/questions'
import { chapterTexts } from '@/lib/chapterTexts'
import { formatChapterText } from '@/lib/formatText'
import { buildSegments } from '@/lib/ankiMask'
import { maskData, maskExcludes } from '@/lib/maskData'
import type { TextSegment } from '@/lib/ankiTypes'

// ──────────────────────────────────────────────
type Section = 'sōron' | 'kakuron'
type Level   = 1 | 2 | 3
type SubTab  = 'kijun' | 'kiji'

const SECTION_LABEL: Record<Section, string> = {
  'sōron':   '総　論',
  'kakuron': '各　論',
}

// 「問題レベル」感を消す → 赤シートの濃さ表現
const LEVEL_LABEL: Record<Level, string> = {
  1: '弱',
  2: '中',
  3: '強',
}
const LEVEL_DESC: Record<Level, string> = {
  1: '最重要語のみ',
  2: '重要語（短答向け）',
  3: 'ほぼ全語（論文向け）',
}

// ──────────────────────────────────────────────
// 累積マスク語を返す（L2 = L1+L2, L3 = 全語）
// ──────────────────────────────────────────────
function getMaskWords(chapterKey: string, level: Level): string[] {
  return (maskData[chapterKey] ?? [])
    .filter(e => e.level <= level)
    .map(e => e.target)
}

// ■ の個数（文字数ぴったり、最大7）
function maskChars(word: string): string {
  return '■'.repeat(Math.min(word.length, 7))
}

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function AnkiRedSheet() {
  const [section,  setSection]  = useState<Section>('sōron')
  const [chNum,    setChNum]    = useState(1)
  const [level,    setLevel]    = useState<Level>(2)
  const [subTab,   setSubTab]   = useState<SubTab>('kijun')
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  // ── 章データ ──────────────────────────────
  const chapters = chapterList.filter(c => c.section === section)
  const chEntry  = chapters.find(c => c.chapterNum === chNum) ?? chapters[0]
  const chKey    = chEntry?.id ?? ''

  // ── テキスト ──────────────────────────────
  const data     = chapterTexts[chKey] ?? { kijun: '', kiji: '' }
  const hasKiji  = data.kiji.trim().length > 0
  const rawText  = subTab === 'kijun' ? data.kijun : data.kiji
  const fullText = useMemo(() => formatChapterText(rawText), [rawText])

  // ── マスク語 ──────────────────────────────
  const maskWords   = useMemo(() => getMaskWords(chKey, level), [chKey, level])
  const excludeWords = useMemo(() => maskExcludes[chKey] ?? [], [chKey])

  // ── セグメント ────────────────────────────
  const segments: TextSegment[] = useMemo(
    () => buildSegments(fullText, maskWords, excludeWords),
    [fullText, maskWords, excludeWords],
  )

  const maskedSegs = segments.filter(
    (s): s is { kind: 'masked'; word: string; segId: number } => s.kind === 'masked',
  )
  const maskedCount   = maskedSegs.length
  const revealedCount = maskedSegs.filter(s => revealed.has(s.segId)).length

  // ── ハンドラ ──────────────────────────────
  const toggle = useCallback((segId: number) => {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(segId)) next.delete(segId)
      else next.add(segId)
      return next
    })
  }, [])

  function changeSection(s: Section) {
    setSection(s)
    setChNum(1)
    setRevealed(new Set())
  }

  function changeChapter(num: number) {
    setChNum(num)
    setRevealed(new Set())
  }

  function changeLevel(l: Level) {
    setLevel(l)
    setRevealed(new Set())
  }

  function changeSubTab(t: SubTab) {
    setSubTab(t)
    setRevealed(new Set())
  }

  // ──────────────────────────────────────────
  // レンダリング
  // ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">

      {/* ══ 総論 / 各論 タブ ══ */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {(['sōron', 'kakuron'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => changeSection(s)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              section === s
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-400 active:text-gray-600'
            }`}
          >
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>

      {/* ══ 章セレクター ══ */}
      <div className="border-b border-gray-100 flex-shrink-0">
        <div className="flex overflow-x-auto gap-1.5 px-4 py-2.5 scrollbar-none">
          {chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => changeChapter(ch.chapterNum)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                chNum === ch.chapterNum
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              第{ch.chapterNum}章
            </button>
          ))}
        </div>
      </div>

      {/* ══ コントロールバー ══ */}
      <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-3 flex-shrink-0">

        {/* 赤シートラベル + レベル */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-medium">赤シート</span>
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {([1, 2, 3] as Level[]).map(l => (
              <button
                key={l}
                onClick={() => changeLevel(l)}
                className={`px-2.5 py-[5px] rounded-[5px] text-xs font-bold transition-all ${
                  level === l
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-gray-500 active:bg-white/70'
                }`}
              >
                {LEVEL_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        {/* レベル説明 */}
        <span className="text-[10px] text-gray-400 flex-1 hidden sm:block">
          {LEVEL_DESC[level]}
        </span>

        {/* 基準 / 留意事項 */}
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 flex-shrink-0 ml-auto">
          {(['kijun', 'kiji'] as SubTab[]).map(t => (
            <button
              key={t}
              onClick={() => changeSubTab(t)}
              disabled={t === 'kiji' && !hasKiji}
              className={`px-2.5 py-[5px] rounded-[5px] text-[11px] font-bold transition-all ${
                subTab === t
                  ? 'bg-white text-gray-800 shadow-sm'
                  : t === 'kiji' && !hasKiji
                    ? 'text-gray-300'
                    : 'text-gray-500 active:bg-white/70'
              }`}
            >
              {t === 'kijun' ? '基準' : '留意'}
            </button>
          ))}
        </div>
      </div>

      {/* ══ 本文スクロール ══ */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 pb-24">

          {/* 章ラベル */}
          <p className="text-[11px] text-gray-400 mb-5">
            {chEntry?.label}　{subTab === 'kijun' ? '不動産鑑定評価基準' : '留意事項'}
          </p>

          {fullText ? (
            // ─── 本文（インラインマスク付き） ───
            <div className="text-[15px] text-gray-800 leading-[2.2] tracking-wide">
              {segments.map((seg, i) => {

                // ── 通常テキスト ──
                if (seg.kind === 'text') {
                  return (
                    <span key={i} className="whitespace-pre-wrap">
                      {seg.content}
                    </span>
                  )
                }

                // ── マスクボタン ──
                // 文字サイズぴったり、行間を壊さないインラインデザイン
                const isRevealed = revealed.has(seg.segId)
                return (
                  <button
                    key={i}
                    onClick={() => toggle(seg.segId)}
                    className={[
                      'inline-block align-baseline',
                      'mx-[1px] px-[3px] py-0',
                      'rounded-[3px]',
                      'transition-colors duration-100',
                      'active:opacity-60',
                      isRevealed
                        ? 'bg-amber-50 text-red-700'
                        : 'bg-red-700 text-red-700 select-none',
                    ].join(' ')}
                    style={{ fontSize: 'inherit', lineHeight: '1.25' }}
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

          {/* ヒント（初回のみ表示） */}
          {maskedCount > 0 && revealedCount === 0 && (
            <p className="text-[11px] text-gray-300 text-center mt-10">
              ■■■ をタップすると語句が表示されます
            </p>
          )}

          {/* マスク未設定 */}
          {maskedCount === 0 && fullText && (
            <p className="text-[11px] text-gray-300 text-center mt-10">
              このチャプターのマスクは準備中です
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
