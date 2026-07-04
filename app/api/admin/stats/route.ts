import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // ── 認証チェック ─────────────────────────────────────────────
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── サービスロールクライアント ────────────────────────────────
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now   = new Date()
  const d7    = new Date(now.getTime() - 7  * 86400_000).toISOString()
  const d30   = new Date(now.getTime() - 30 * 86400_000).toISOString()
  const jstNow = new Date(now.getTime() + 9 * 3600_000)
  const today  = jstNow.toISOString().slice(0, 10)

  // ── 並行クエリ ───────────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: totalAnswers },
    { count: todayAnswers },
    { data: active7Raw },
    { data: active30Raw },
    { data: scoreRaw },
    { data: missedRaw },
    { data: questionRaw },
    { data: recentRaw },
  ] = await Promise.all([
    // 総ユーザー数
    svc.from('profiles').select('*', { count: 'exact', head: true }),
    // 総回答数
    svc.from('answer_logs').select('*', { count: 'exact', head: true }),
    // 今日の回答数（JST基準）
    svc.from('answer_logs').select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00+09:00`),
    // 7日間のアクティブユーザー（user_id一覧）
    svc.from('answer_logs').select('user_id').gte('created_at', d7),
    // 30日間のアクティブユーザー
    svc.from('answer_logs').select('user_id').gte('created_at', d30),
    // 平均スコア用（最新1000件）
    svc.from('answer_logs').select('score').not('score', 'is', null).limit(1000),
    // 全ユーザーの missed_keywords（最新500件）
    svc.from('answer_logs').select('missed_keywords').not('missed_keywords', 'is', null).limit(500),
    // 回答数が多い問題
    svc.from('answer_logs').select('question_slug').limit(2000),
    // 直近の回答（タイムライン用）
    svc.from('answer_logs')
      .select('question_slug, score, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // ── 集計 ─────────────────────────────────────────────────────

  const activeUsers7  = new Set(active7Raw?.map(r => r.user_id)  ?? []).size
  const activeUsers30 = new Set(active30Raw?.map(r => r.user_id) ?? []).size

  const avgScore = scoreRaw && scoreRaw.length > 0
    ? Math.round(scoreRaw.reduce((s, r) => s + (r.score ?? 0), 0) / scoreRaw.length)
    : null

  // 苦手キーワード集計
  const kwCounts: Record<string, number> = {}
  missedRaw?.forEach(row => {
    (row.missed_keywords as string[] ?? []).forEach(kw => {
      kwCounts[kw] = (kwCounts[kw] ?? 0) + 1
    })
  })
  const topMissed = Object.entries(kwCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  // 人気問題集計
  const qCounts: Record<string, number> = {}
  questionRaw?.forEach(row => {
    qCounts[row.question_slug] = (qCounts[row.question_slug] ?? 0) + 1
  })
  const topQuestions = Object.entries(qCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => ({ slug, count }))

  return NextResponse.json({
    totalUsers:   totalUsers   ?? 0,
    totalAnswers: totalAnswers ?? 0,
    todayAnswers: todayAnswers ?? 0,
    activeUsers7,
    activeUsers30,
    avgScore,
    topMissed,
    topQuestions,
    recentAnswers: recentRaw ?? [],
  })
}
