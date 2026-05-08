/**
 * CSV の explanation カラムを Claude API で自動生成するスクリプト
 *
 * 実行方法:
 *   npm run gen:explanations
 *
 * 必要な環境変数 (.env.local):
 *   ANTHROPIC_API_KEY=sk-ant-...
 *
 * 挙動:
 *   - explanation が空の行のみ生成（既存の内容は上書きしない）
 *   - 1問ずつ生成しながら都度CSVに書き戻す（中断してもそこから再開可能）
 *   - レート制限対策として1問ごとに少し待機
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = path.join(__dirname, '..', 'data', 'questions.csv')

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY が未設定です (.env.local を確認)')
  process.exit(1)
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ── システムプロンプト ─────────────────────────────────────

const SYSTEM_PROMPT = `あなたは不動産鑑定評価基準の専門家です。
与えられた問題と解答をもとに、受験生向けの「explanation（解説文）」を作成します。

# 作成ルール

## 目的
「条文暗記の補助」「理解促進」「混同防止」を目的とする。
単なる言い換えではなく、なぜその表現になるのか・何と区別するべきか・どこが重要かを短く整理する。

## 文字数
50〜120文字程度、1〜3文。一瞬で読める長さ。

## 方針
- 初学者でも理解できる日本語で書く
- 試験上重要なニュアンスは崩さない
- 「答案」ではなく「理解補助」を書く
- 常体（〜である）ベース
- 「つまり」「簡単に言うと」の多用禁止
- 不確かな解釈・AI特有の曖昧表現・励まし文・不自然な比喩は禁止

## 含めて良い内容
- 用語の意味・条文趣旨
- 試験での重要ポイント
- 混同しやすい概念との違い（例：正常価格 vs 限定価格）
- 覚える際の着眼点・要件整理

## 定義系の問題では
「何を定義しているのか」「何を除外しているのか」「どの条件が重要か」を明示する。

## 穴埋め問題では
抜けている語句の意味・なぜその語句になるのかを補足する（答えの再掲は禁止）。

## 全文回答問題では
丸暗記でなく構造理解を補助する。文の役割・要件の流れを簡潔に説明する。

# NG例
「この概念は非常に重要なのでしっかり覚えましょう！」
「これは簡単に言うと不動産の値段です。」

# OK例
「正常価格は、市場参加者が合理的に行動する通常の市場を前提として形成される価格である。特殊事情が排除される点が重要。」
「原価法は、再調達原価を基礎に価格を求める手法であり、対象不動産の費用性に着目する。」

# 出力形式
explanation テキストのみを出力する。前置き・見出し・Markdown記法は一切不要。`

// ── CSV 読み書き ──────────────────────────────────────────

type Row = Record<string, string>

function loadCsv(csvPath: string): Row[] {
  let content = fs.readFileSync(csvPath, 'utf-8')
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Row[]
}

function saveCsv(csvPath: string, rows: Row[], columns: string[]) {
  const out = stringify(rows, { header: true, columns })
  fs.writeFileSync(csvPath, '﻿' + out, 'utf-8')
}

// ── explanation 生成 ──────────────────────────────────────

async function generateExplanation(title: string, answer: string): Promise<string> {
  const userMessage = `問題タイトル: ${title}\n\n解答:\n${answer}`

  const message = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('unexpected response type')
  return block.text.trim()
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── メイン ────────────────────────────────────────────────

async function main() {
  const rows    = loadCsv(CSV_PATH)
  const columns = Object.keys(rows[0])

  // explanation カラムがなければ追加
  if (!columns.includes('explanation')) columns.push('explanation')

  const targets = rows.filter(r => !r.explanation?.trim())
  const total   = rows.length
  const pending = targets.length

  console.log('━'.repeat(50))
  console.log('🤖 explanation 自動生成')
  console.log(`   全問題数:    ${total}`)
  console.log(`   生成対象:    ${pending}（空欄のみ）`)
  console.log(`   スキップ:    ${total - pending}（既存）`)
  console.log('━'.repeat(50) + '\n')

  if (pending === 0) {
    console.log('✅ 生成対象がありません（全問に explanation が入っています）')
    return
  }

  let done = 0
  let errors = 0

  for (const row of rows) {
    if (row.explanation?.trim()) continue  // 既存はスキップ

    process.stdout.write(`  [${done + 1}/${pending}] ${row.slug} "${row.title?.slice(0, 20)}..." `)

    try {
      row.explanation = await generateExplanation(row.title, row.answer)
      console.log('✅')
      done++
    } catch (e: unknown) {
      console.log(`❌ ${e instanceof Error ? e.message : String(e)}`)
      row.explanation = ''
      errors++
    }

    // 都度保存（中断しても途中まで保持される）
    saveCsv(CSV_PATH, rows, columns)

    // レート制限対策（500ms 待機）
    if (done + errors < pending) await sleep(500)
  }

  console.log('\n' + '━'.repeat(50))
  console.log(`✅ 完了: ${done}件生成  ❌ エラー: ${errors}件`)
  console.log(`📄 出力: ${CSV_PATH}`)
  console.log('━'.repeat(50))
}

main().catch(err => {
  console.error('❌ 予期しないエラー:', err)
  process.exit(1)
})
