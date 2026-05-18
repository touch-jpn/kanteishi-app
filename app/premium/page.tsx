'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadPremiumState,
  isPremiumActive,
  getRemainingDays,
  startTrial,
  cancelPremium,
} from '@/lib/premium'
import type { PremiumState } from '@/lib/types'

export default function PremiumPage() {
  const router = useRouter()
  const [state, setState] = useState<PremiumState>({ isPremium: false, planType: null, expiresAt: null })
  const [active, setActive] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    setState(loadPremiumState())
    setActive(isPremiumActive())
    setRemaining(getRemainingDays())
  }, [])

  function handleTrial() {
    startTrial(9999) // β版期間中は無期限
    router.push('/study')
  }

  function handleCancel() {
    cancelPremium()
    setState({ isPremium: false, planType: null, expiresAt: null })
    setActive(false)
    setRemaining(null)
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4">
        <div className="flex items-center gap-3 h-14">
          <button
            onClick={() => router.back()}
            className="text-gray-500 p-1 -ml-1"
            aria-label="戻る"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-sm font-bold text-gray-800">機能について</p>
        </div>
      </header>

      <div className="px-4 py-5 space-y-4">

        {/* β版バナー */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center space-y-1">
          <p className="text-sm font-black text-blue-700">🎁 β版期間中は全機能無料</p>
          <p className="text-xs text-blue-600">現在β版として公開中のため、全ての機能を無料でお試しいただけます。</p>
        </div>

        {/* 現在の状態（有効時） */}
        {active && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-green-800">全機能が利用可能です</p>
                <p className="text-xs text-green-600 mt-0.5">β版期間中は全ての機能を無料でご利用いただけます</p>
              </div>
            </div>
          </div>
        )}

        {/* 機能比較 */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500">利用できる機能</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { icon: '📝', label: '穴埋めモード', desc: 'キーワードを手入力して暗記', free: true },
              { icon: '✍️', label: '全文入力モード', desc: '基準を自由に入力して採点', free: false },
              { icon: '⭐', label: 'おすすめ問題', desc: '忘却曲線で最適タイミングに出題', free: false },
              { icon: '📅', label: '復習スケジュール', desc: '「明日また復習する」で翌日に再出題', free: true },
              { icon: '📖', label: '基準・留意事項閲覧', desc: '全文をいつでも読み返せる', free: true },
              { icon: '🔖', label: 'ブックマーク', desc: '気になる問題を保存', free: true },
            ].map(({ icon, label, desc, free }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  free ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'
                }`}>
                  {free ? '無料' : 'PRO'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 有効化ボタン（未有効時） */}
        {!active && (
          <button
            onClick={handleTrial}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl active:bg-blue-700 shadow-md"
          >
            全機能を使ってみる（無料）
          </button>
        )}

        {/* 学習開始ボタン（有効時） */}
        {active && (
          <>
            <button
              onClick={() => router.push('/study')}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl active:bg-blue-700"
            >
              学習を始める →
            </button>
            <button
              onClick={handleCancel}
              className="w-full py-3 text-xs text-gray-300 active:text-gray-500"
            >
              全機能を無効にする
            </button>
          </>
        )}

        {/* 将来予告 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-bold text-gray-400">今後追加予定の機能</p>
          <p className="text-xs text-gray-400">・AI採点の精度向上</p>
          <p className="text-xs text-gray-400">・学習分析ダッシュボード</p>
          <p className="text-xs text-gray-400">・正式版リリース後に一部機能が有料化される予定です</p>
        </div>

      </div>
    </div>
  )
}
