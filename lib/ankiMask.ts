/**
 * テキストマスク処理
 *
 * 安全置換の設計原則:
 * 1. 対象語を長さ降順ソート → 長い語を優先マッチ（「正常価格」を「価格」より先に捕捉）
 * 2. 正規表現の特殊文字をエスケープ
 * 3. 重複語はSetで排除
 * 4. 単純replace禁止 → セグメント配列で管理（タップ個別開示のため）
 */
import type { TextSegment } from './ankiTypes'

/**
 * テキストをセグメント配列に変換する。
 *
 * @param text        対象テキスト
 * @param maskWords   マスクする語句リスト
 * @param excludeWords マスクしない語句リスト（サブワードとしてマッチしないよう先に消費する）
 */
export function buildSegments(
  text: string,
  maskWords: string[],
  excludeWords: string[] = [],
): TextSegment[] {
  const uniqueMasks   = [...new Set(maskWords.filter(w => w.length > 0))]
  const uniqueExcludes = [...new Set(excludeWords.filter(w => w.length > 0))]

  const allWords = [...uniqueMasks, ...uniqueExcludes]
  if (allWords.length === 0) {
    return [{ kind: 'text', content: text }]
  }

  // 長い語を優先してマッチ（除外語も含めてソート → 「自然的特性」を「自然的」より先に消費）
  const sorted  = allWords.sort((a, b) => b.length - a.length)
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g')

  const excludeSet = new Set(uniqueExcludes)

  const segments: TextSegment[] = []
  let lastIndex = 0
  let segId = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: text.slice(lastIndex, match.index) })
    }
    if (excludeSet.has(match[0])) {
      // 除外語: マッチだけして素通し（サブワードの誤マスク防止）
      segments.push({ kind: 'text', content: match[0] })
    } else {
      segments.push({ kind: 'masked', word: match[0], segId: segId++ })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', content: text.slice(lastIndex) })
  }

  return segments
}

/** レベルに対応するマスク語配列を返す（累積型） */
export function getMaskWords(
  level1: string[],
  level2: string[],
  level3: string[],
  level: 1 | 2 | 3,
): string[] {
  if (level === 1) return level1
  if (level === 2) return [...level1, ...level2]
  return [...level1, ...level2, ...level3]
}
