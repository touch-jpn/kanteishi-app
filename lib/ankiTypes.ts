// ==========================================
// 赤シートDB 共通型定義
// ==========================================

export interface AnkiEntry {
  id: string
  source: string     // ロード元ファイル名（フィルター用）
  category: string
  section: string
  text: string
  level1: string[]   // pipe-separated → array
  level2: string[]
  level3: string[]
  tags: string[]
  difficulty: 1 | 2 | 3
}

/** 選択中の暗記レベル */
export type AnkiLevel = 1 | 2 | 3

/** テキストを分割したセグメント */
export type TextSegment =
  | { kind: 'text'; content: string }
  | { kind: 'masked'; word: string; segId: number }

/** データソース定義 */
export interface AnkiSource {
  filename: string
  label: string
  shortLabel: string
}

export const ANKI_SOURCES: AnkiSource[] = [
  { filename: 'souron_verbatim_v1.csv',     label: '総論 1〜7章',        shortLabel: '総1-7' },
  { filename: 'souron_ch8_verbatim_v1.csv', label: '総論 8章（手順）',   shortLabel: 'Ch8'   },
  { filename: 'souron_ch9_verbatim_v1.csv', label: '総論 9章（報告書）', shortLabel: 'Ch9'   },
  { filename: 'kakuron_verbatim_v1.csv',    label: '各論（価格・賃料・証券化）', shortLabel: '各論' },
]

export const LEVEL_LABELS: Record<AnkiLevel, string> = {
  1: 'L1 認識',
  2: 'L2 構造',
  3: 'L3 論文',
}
