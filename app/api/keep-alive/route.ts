/**
 * GET /api/keep-alive
 *
 * Supabase 無料プランは7日間アクセスがないと一時停止する。
 * このエンドポイントを定期的に叩くことでプロジェクトをアクティブに保つ。
 *
 * 呼び出し元: .github/workflows/keep-supabase-alive.yml（3日おき）
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
                ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Supabase env vars not set' },
      { status: 500 },
    )
  }

  try {
    const supabase = createClient(url, key)

    // profiles テーブルに軽量クエリを投げて DB を起こす
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      ok:   true,
      ping: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    )
  }
}
