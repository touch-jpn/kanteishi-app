'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadPremiumState,
  isPremiumActive,
  getRemainingDays,
  startTrial,
  activatePlan,
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
    startTrial(14)
    router.push('/')
  }

  function handleMonthly() {
    activatePlan('monthly')
    router.push('/')
  }

  function handleYearly() {
    activatePlan('yearly')
    router.push('/')
  }

  function handleCancel() {
    cancelPremium()
    setState({ isPremium: false, planType: null, expiresAt: null })
    setActive(false)
    setRemaining(null)
  }

  const planLabel: Record<string, string> = {
    trial: '無料体験中',
    monthly: '月額プラン',
    yearly: '年額プラン',
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-amber-500 text-white px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4 pb-4">
          <button
            onClick={() => router.push('/')}
            className="text-2xl leading-none active:opacity-70 p-1"
            aria-label="戻る"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold">プレミアムプラン</h1>
            <p className="text-amber-100 text-xs">不動産鑑定士 暗記アプリ</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 space-y-4">

        {/* 現在の状態 */}
        {active && state.expiresAt && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800">
                  ⭐ {planLabel[state.planType ?? ''] ?? 'プレミアム'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  有効期限：{state.expiresAt}
                  {remaining !== null && (
                    <span className="ml-2 font-bold text-amber-700">（残り{remaining}日）</span>
                  )}
                </p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
        )}

        {/* 機能比較 */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4 text-left text-gray-500 font-medium">機能</th>
                <th className="py-3 px-3 text-center text-gray-500 font-medium">無料</th>
                <th className="py-3 px-3 text-center text-amber-600 font-bold bg-amber-50">⭐ 有料</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 px-4 text-gray-700">穴埋めモード</td>
                <td className="py-3 px-3 text-center text-green-500 font-bold">∞</td>
                <td className="py-3 px-3 text-center text-green-500 font-bold bg-amber-50">∞</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">全文入力モード</td>
                <td className="py-3 px-3 text-center text-gray-300">×</td>
                <td className="py-3 px-3 text-center text-green-500 font-bold bg-amber-50">∞</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">おすすめ問題<br /><span className="text-xs text-gray-400">（忘却曲線）</span></td>
                <td className="py-3 px-3 text-center text-gray-300">×</td>
                <td className="py-3 px-3 text-center text-green-500 font-bold bg-amber-50">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">メモ機能</td>
                <td className="py-3 px-3 text-center text-gray-300">×</td>
                <td className="py-3 px-3 text-center text-green-500 font-bold bg-amber-50">✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* プラン選択 */}
        {!active && (
          <>
            {/* 無料体験 */}
            <button
              onClick={handleTrial}
              className="w-full bg-amber-500 text-white rounded-2xl p-5 text-left shadow-md active:bg-amber-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">14日間 無料体験</p>
                  <p className="text-amber-100 text-sm mt-0.5">クレジットカード不要 · すぐ開始</p>
                </div>
                <span className="text-3xl">🎁</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {/* 月額 */}
              <button
                onClick={handleMonthly}
                className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-center shadow-sm active:bg-gray-50"
              >
                <p className="text-xs text-gray-500 font-medium">月額プラン</p>
                <p className="text-2xl font-extrabold text-gray-800 mt-1">¥980</p>
                <p className="text-xs text-gray-400 mt-0.5">/ 月</p>
                <div className="mt-3 bg-blue-600 text-white text-sm font-bold py-2 rounded-xl">
                  開始する
                </div>
              </button>

              {/* 年額 */}
              <button
                onClick={handleYearly}
                className="bg-white border-2 border-blue-500 rounded-2xl p-4 text-center shadow-sm active:bg-blue-50 relative"
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  お得
                </span>
                <p className="text-xs text-gray-500 font-medium">年額プラン</p>
                <p className="text-2xl font-extrabold text-gray-800 mt-1">¥9,800</p>
                <p className="text-xs text-gray-400 mt-0.5">/ 年（月833円）</p>
                <div className="mt-3 bg-blue-600 text-white text-sm font-bold py-2 rounded-xl">
                  開始する
                </div>
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 px-4">
              ※ このアプリはモックです。実際の課金は発生しません。
            </p>
          </>
        )}

        {/* 現在プレミアムの場合 */}
        {active && (
          <>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl active:bg-blue-700"
            >
              学習を始める →
            </button>

            <button
              onClick={handleCancel}
              className="w-full py-3 text-sm text-gray-400 active:text-gray-600"
            >
              プレミアムを解除する
            </button>
          </>
        )}
      </div>
    </div>
  )
}
