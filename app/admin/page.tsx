'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'

interface DayPoint   { date: string; answers: number; users: number; [k: string]: string | number }
interface SignupPoint { date: string; count: number;  [k: string]: string | number }
interface HourPoint  { hour: number; count: number;  [k: string]: string | number }

interface LoginRecord { email: string; last_sign_in: string; created_at: string }

interface Stats {
  totalUsers:    number
  totalAnswers:  number
  todayAnswers:  number
  activeUsers7:  number
  activeUsers30: number
  avgScore:      number | null
  topMissed:     { word: string; count: number }[]
  topQuestions:  { slug: string; count: number }[]
  recentAnswers: { question_slug: string; score: number | null; answered_at: string }[]
  dailyActivity: DayPoint[]
  dailySignups:  SignupPoint[]
  hourlyActivity: HourPoint[]
  loginHistory:  LoginRecord[]
}

// ── グラフコンポーネント ──────────────────────────────────────

function BarChart({
  data,
  valueKey,
  color = '#3b82f6',
  height = 64,
  showDate = false,
}: {
  data: Record<string, number | string>[]
  valueKey: string
  color?: string
  height?: number
  showDate?: boolean
}) {
  const values = data.map(d => Number(d[valueKey]))
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((d, i) => {
        const v = Number(d[valueKey])
        const barH = Math.max(v > 0 ? 2 : 0, Math.round((v / max) * height))
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{ height: barH, backgroundColor: color, opacity: v === 0 ? 0.15 : 1 }}
            />
            {/* tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
              <div className="bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                {showDate && <span className="text-gray-400 mr-1">{(d['date'] as string)?.slice(5)}</span>}
                {v}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HourChart({ data }: { data: HourPoint[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-px" style={{ height: 48 }}>
      {data.map(d => {
        const h = Math.max(d.count > 0 ? 2 : 0, Math.round((d.count / max) * 48))
        return (
          <div key={d.hour} className="flex-1 flex flex-col items-center justify-end group relative">
            <div
              className="w-full rounded-t-sm"
              style={{ height: h, backgroundColor: '#8b5cf6', opacity: d.count === 0 ? 0.15 : 1 }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
              <div className="bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                {d.hour}時 / {d.count}回
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color = 'text-gray-800',
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-extrabold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login?returnTo=/admin'); return }

    async function load() {
      setFetching(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login?returnTo=/admin'); return }

      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 403) {
        setError('管理者権限がありません')
        setFetching(false)
        return
      }
      if (!res.ok) {
        setError('データ取得に失敗しました')
        setFetching(false)
        return
      }
      setStats(await res.json())
      setFetching(false)
    }
    load()
  }, [user, loading, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-red-500 font-bold">{error}</p>
        <a href="/study" className="text-sm text-blue-600">← ホームへ戻る</a>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 flex items-center gap-3 h-14 sticky top-0 z-10">
        <a href="/" className="text-gray-400 text-lg font-bold leading-none p-1 -ml-1">‹</a>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">管理ダッシュボード</p>
          <p className="text-[10px] text-gray-400">管理者専用</p>
        </div>
        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
      </header>

      <main className="px-4 pt-5 pb-12 space-y-5">

        {/* ── アクセス記録 ── */}
        <section>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">アクセス記録（過去30日）</p>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">

            {/* 日別回答数 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-600">日別回答数</p>
                <p className="text-[10px] text-gray-400">
                  合計 {stats.dailyActivity.reduce((s, d) => s + d.answers, 0).toLocaleString()} 回
                </p>
              </div>
              <BarChart
                data={stats.dailyActivity}
                valueKey="answers"
                color="#3b82f6"
                height={64}
                showDate
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-300">{stats.dailyActivity[0]?.date?.slice(5)}</span>
                <span className="text-[10px] text-gray-300">{stats.dailyActivity[stats.dailyActivity.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* 日別ユニークユーザー */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-600">日別アクティブユーザー</p>
                <p className="text-[10px] text-gray-400">回答したユニークユーザー数</p>
              </div>
              <BarChart
                data={stats.dailyActivity}
                valueKey="users"
                color="#10b981"
                height={48}
                showDate
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* 新規登録推移 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-600">新規ユーザー登録</p>
                <p className="text-[10px] text-gray-400">
                  30日で +{stats.dailySignups.reduce((s, d) => s + d.count, 0)} 人
                </p>
              </div>
              <BarChart
                data={stats.dailySignups}
                valueKey="count"
                color="#f59e0b"
                height={40}
                showDate
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* 時間帯別 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-600">時間帯別アクセス（7日間・JST）</p>
              </div>
              <HourChart data={stats.hourlyActivity} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-300">0時</span>
                <span className="text-[10px] text-gray-300">12時</span>
                <span className="text-[10px] text-gray-300">23時</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── ユーザー ── */}
        <section>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">ユーザー</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="総ユーザー" value={stats.totalUsers} color="text-blue-600" />
            <StatCard label="7日間アクティブ" value={stats.activeUsers7} sub="回答した人" />
            <StatCard label="30日間アクティブ" value={stats.activeUsers30} sub="回答した人" />
          </div>
        </section>

        {/* ── 回答 ── */}
        <section>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">学習アクティビティ</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="総回答数" value={stats.totalAnswers.toLocaleString()} color="text-emerald-600" />
            <StatCard label="今日の回答" value={stats.todayAnswers} />
            <StatCard
              label="平均スコア"
              value={stats.avgScore !== null ? `${stats.avgScore}点` : '—'}
              sub="採点済み回答"
            />
          </div>
        </section>

        {/* ── よく落とされるキーワード ── */}
        {stats.topMissed.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
              よく落とされるキーワード（全ユーザー）
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
              {stats.topMissed.map(({ word, count }, i) => (
                <div key={word} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-300 font-bold w-4">{i + 1}</span>
                    <span className="text-sm font-bold text-gray-800">{word}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full bg-red-300"
                      style={{ width: `${Math.round((count / stats.topMissed[0].count) * 80)}px` }}
                    />
                    <span className="text-xs text-red-500 font-bold w-12 text-right">{count}回</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 人気問題 ── */}
        {stats.topQuestions.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
              回答数ランキング（問題）
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
              {stats.topQuestions.map(({ slug, count }, i) => (
                <div key={slug} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-300 font-bold w-4">{i + 1}</span>
                    <span className="text-sm text-gray-700 font-medium">{slug}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-bold">{count}回</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 直近の回答 ── */}
        {stats.recentAnswers.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">直近の回答</p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
              {stats.recentAnswers.map((r, i) => {
                const d = new Date(r.answered_at)
                const jst = new Date(d.getTime() + 9 * 3600_000)
                const label = jst.toISOString().replace('T', ' ').slice(5, 16)
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{r.question_slug}</p>
                      <p className="text-xs text-gray-400">{label} JST</p>
                    </div>
                    {r.score !== null ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.score >= 80 ? 'bg-green-100 text-green-600'
                        : r.score >= 60 ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-500'
                      }`}>
                        {r.score}点
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {/* ── ログイン履歴 ── */}
        {stats.loginHistory.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
              ログイン履歴（最終ログイン順）
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
              {stats.loginHistory.map((r, i) => {
                const toJST = (iso: string) => {
                  const d = new Date(new Date(iso).getTime() + 9 * 3600_000)
                  return d.toISOString().replace('T', ' ').slice(0, 16)
                }
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{r.email}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        登録: {toJST(r.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 font-bold">{toJST(r.last_sign_in)}</p>
                      <p className="text-[10px] text-gray-300">最終ログイン JST</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
