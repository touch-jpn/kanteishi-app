'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'

interface Stats {
  totalUsers:    number
  totalAnswers:  number
  todayAnswers:  number
  activeUsers7:  number
  activeUsers30: number
  avgScore:      number | null
  topMissed:     { word: string; count: number }[]
  topQuestions:  { slug: string; count: number }[]
  recentAnswers: { question_slug: string; score: number | null; created_at: string }[]
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
        <a href="/study" className="text-gray-400 text-lg font-bold leading-none p-1 -ml-1">‹</a>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">管理ダッシュボード</p>
          <p className="text-[10px] text-gray-400">管理者専用</p>
        </div>
        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
      </header>

      <main className="px-4 pt-5 pb-12 space-y-5">

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
                const d = new Date(r.created_at)
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
      </main>
    </div>
  )
}
