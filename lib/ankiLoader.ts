/**
 * CSVローダー（クライアントサイド fetch）
 * public/ankidb/ に配置された UTF-8 BOM付きCSVを取得・パース
 */
import type { AnkiEntry } from './ankiTypes'

// -----------------------------------------------
// CSV パーサー（RFC 4180準拠 簡易実装）
// -----------------------------------------------
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  const len = line.length

  while (i <= len) {
    if (i === len) {
      // 末端に空フィールドがある場合は追加しない（末尾LF対策）
      break
    }

    if (line[i] === '"') {
      // クォートフィールド
      i++ // 開きクォートをスキップ
      let field = ''
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            field += '"'
            i += 2
          } else {
            i++ // 閉じクォートをスキップ
            break
          }
        } else {
          field += line[i]
          i++
        }
      }
      fields.push(field)
      if (i < len && line[i] === ',') i++
    } else {
      // 非クォートフィールド
      const comma = line.indexOf(',', i)
      if (comma === -1) {
        fields.push(line.slice(i).replace(/\r$/, ''))
        break
      }
      fields.push(line.slice(i, comma))
      i = comma + 1
    }
  }

  return fields
}

function parseCSV(raw: string): Record<string, string>[] {
  // BOM除去・CRLF統一
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })
    rows.push(row)
  }

  return rows
}

function parsePipe(value: string | undefined): string[] {
  if (!value || value.trim() === '') return []
  return value.split('|').map(v => v.trim()).filter(v => v.length > 0)
}

function rowToEntry(row: Record<string, string>, source: string): AnkiEntry | null {
  const id = row['id']?.trim()
  const text = row['text']?.trim()
  if (!id || !text) return null

  const diff = Number(row['difficulty'])
  const difficulty: 1 | 2 | 3 = (diff === 2 ? 2 : diff === 3 ? 3 : 1)

  return {
    id,
    source,
    category: row['category']?.trim() ?? '',
    section:  row['section']?.trim()  ?? '',
    text,
    level1:    parsePipe(row['level1']),
    level2:    parsePipe(row['level2']),
    level3:    parsePipe(row['level3']),
    tags:      parsePipe(row['tags']),
    difficulty,
  }
}

// -----------------------------------------------
// 公開API
// -----------------------------------------------

/** 単一CSVをfetch・パースしてエントリ配列を返す */
export async function loadAnkiCSV(filename: string): Promise<AnkiEntry[]> {
  try {
    const res = await fetch(`/ankidb/${filename}`, { cache: 'force-cache' })
    if (!res.ok) {
      console.warn(`[ankiLoader] failed to fetch ${filename}: ${res.status}`)
      return []
    }
    const raw = await res.text()
    const rows = parseCSV(raw)
    return rows.map(row => rowToEntry(row, filename)).filter((e): e is AnkiEntry => e !== null)
  } catch (err) {
    console.error(`[ankiLoader] error loading ${filename}:`, err)
    return []
  }
}

/** 複数ソースをまとめてロード */
export async function loadAnkiSources(filenames: string[]): Promise<AnkiEntry[]> {
  const results = await Promise.all(filenames.map(loadAnkiCSV))
  return results.flat()
}
