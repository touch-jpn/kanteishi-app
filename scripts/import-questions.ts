/**
 * CSV → Supabase questions テーブル インポートスクリプト
 *
 * 実行方法:
 *   npm run import:questions
 *   または
 *   node --import tsx/esm scripts/import-questions.ts
 *
 * 必要な環境変数 (.env.local):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

// ── 設定 ────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = path.join(__dirname, '..', 'data', 'questions.csv')

const SUPABASE_URL              = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です')
  console.error('   .env.local を確認してください')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── 難易度マッピング（テキスト → 1〜5） ─────────────────────

const DIFFICULTY_MAP: Record<string, number> = {
  'A+': 5,
  'A':  4,
  'B+': 3,
  'B':  2,
  'B-': 1,
  'C':  1,
}

function parseDifficulty(raw: string): number {
  const trimmed = raw.trim()
  // 数値のまま入っている場合はそのまま使用
  const num = Number(trimmed)
  if (!isNaN(num) && num >= 1 && num <= 5) return num
  // テキストの場合はマッピング
  return DIFFICULTY_MAP[trimmed] ?? 1
}

// ── CSV パース ───────────────────────────────────────────────

interface CsvRow {
  slug:          string
  category:      string
  chapter:       string
  question_type: string
  title:         string
  answer:        string
  explanation:   string
  difficulty:    string
  [key: string]: string
}

function loadCsv(csvPath: string): CsvRow[] {
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSVファイルが見つかりません: ${csvPath}`)
    process.exit(1)
  }

  // BOM付きUTF-8 対応
  let content = fs.readFileSync(csvPath, 'utf-8')
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)

  return parse(content, {
    columns:          true,
    skip_empty_lines: true,
    trim:             true,
  }) as CsvRow[]
}

// ── バリデーション ───────────────────────────────────────────

const VALID_QUESTION_TYPES = new Set(['fill_blank', 'full_answer'])

interface Question {
  slug:          string
  category:      string
  chapter:       number
  question_type: string
  title:         string
  answer:        string
  explanation:   string | null
  difficulty:    number
  is_active:     boolean
}

function validateAndTransform(rows: CsvRow[]): { valid: Question[]; skipped: number } {
  const valid: Question[] = []
  let skipped = 0

  for (const [i, row] of rows.entries()) {
    const lineNum = i + 2 // ヘッダー行分 +1、0始まり +1

    if (!row.slug?.trim()) {
      console.warn(`  ⚠️  行${lineNum}: slug が空のためスキップ`)
      skipped++
      continue
    }
    if (!row.title?.trim()) {
      console.warn(`  ⚠️  行${lineNum} [${row.slug}]: title が空のためスキップ`)
      skipped++
      continue
    }
    if (!row.answer?.trim()) {
      console.warn(`  ⚠️  行${lineNum} [${row.slug}]: answer が空のためスキップ`)
      skipped++
      continue
    }

    const chapter = parseInt(row.chapter, 10)
    if (isNaN(chapter) || chapter < 1) {
      console.warn(`  ⚠️  行${lineNum} [${row.slug}]: chapter が不正 ("${row.chapter}")`)
      skipped++
      continue
    }

    const questionType = row.question_type?.trim() || 'fill_blank'
    if (!VALID_QUESTION_TYPES.has(questionType)) {
      console.warn(`  ⚠️  行${lineNum} [${row.slug}]: 未知の question_type "${questionType}" → fill_blank として処理`)
    }

    valid.push({
      slug:          row.slug.trim(),
      category:      row.category?.trim() || '',
      chapter,
      question_type: VALID_QUESTION_TYPES.has(questionType) ? questionType : 'fill_blank',
      title:         row.title.trim(),
      answer:        row.answer.trim(),
      explanation:   row.explanation?.trim() || null,
      difficulty:    parseDifficulty(row.difficulty || '1'),
      is_active:     true,
    })
  }

  return { valid, skipped }
}

// ── Supabase upsert ──────────────────────────────────────────

const BATCH_SIZE = 50

async function upsertBatch(batch: Question[]): Promise<{ inserted: number; error: string | null }> {
  const { error } = await supabase
    .from('questions')
    .upsert(batch, {
      onConflict:        'slug',
      ignoreDuplicates:  false, // slug重複時は上書き（upsert）
    })

  if (error) return { inserted: 0, error: error.message }
  return { inserted: batch.length, error: null }
}

// ── メイン処理 ───────────────────────────────────────────────

async function main() {
  console.log('━'.repeat(50))
  console.log('📥 questions インポート開始')
  console.log(`   CSV: ${CSV_PATH}`)
  console.log(`   DB:  ${SUPABASE_URL}`)
  console.log('━'.repeat(50))

  // 1. CSVロード
  const rows = loadCsv(CSV_PATH)
  console.log(`\n📄 CSVレコード数: ${rows.length}`)

  // 2. バリデーション・変換
  const { valid, skipped } = validateAndTransform(rows)
  console.log(`✅ 有効: ${valid.length}件  ⚠️  スキップ: ${skipped}件\n`)

  if (valid.length === 0) {
    console.log('投入するデータがありません。終了します。')
    return
  }

  // 3. バッチupsert
  let totalInserted = 0
  let totalErrors   = 0
  const errors: string[] = []

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch     = valid.slice(i, i + BATCH_SIZE)
    const batchNum  = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(valid.length / BATCH_SIZE)

    process.stdout.write(`  バッチ ${batchNum}/${totalBatches} (${batch.length}件) ... `)

    const { inserted, error } = await upsertBatch(batch)
    if (error) {
      console.log('❌ エラー')
      errors.push(`バッチ${batchNum}: ${error}`)
      totalErrors += batch.length
    } else {
      console.log('✅')
      totalInserted += inserted
    }
  }

  // 4. 結果サマリー
  console.log('\n' + '━'.repeat(50))
  console.log('📊 インポート結果')
  console.log(`   成功: ${totalInserted}件`)
  if (skipped > 0)      console.log(`   スキップ: ${skipped}件`)
  if (totalErrors > 0)  console.log(`   エラー: ${totalErrors}件`)
  if (errors.length > 0) {
    console.log('\nエラー詳細:')
    errors.forEach(e => console.log(`  - ${e}`))
  }
  console.log('━'.repeat(50))
}

main().catch(err => {
  console.error('❌ 予期しないエラー:', err)
  process.exit(1)
})
