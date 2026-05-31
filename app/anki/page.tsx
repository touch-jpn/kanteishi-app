/**
 * 鑑定評価基準ビューア
 * /anki
 *
 * 基準全文をそのまま表示し、赤シート（L1/L2/L3）で語句をマスク。
 * 問題を解くのではなく「参考書に赤シートを乗せて読む」体験。
 */
import type { Metadata } from 'next'
import KijunViewerWrapper from './KijunViewerWrapper'

export const metadata: Metadata = {
  title: '鑑定評価基準ビューア | 不動産鑑定士 暗記アプリ',
  description: '不動産鑑定評価基準の全文を赤シートで読む',
}

export default function AnkiPage() {
  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto bg-white">
      {/* ─── ページヘッダー ─── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <a
          href="/study"
          className="text-gray-400 text-lg font-bold leading-none p-1 -ml-1 active:text-gray-600"
          aria-label="ホームへ戻る"
        >
          ‹
        </a>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-gray-800 leading-tight">
            鑑定評価基準ビューア
          </h1>
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
            基準全文 + 赤シート暗記
          </p>
        </div>
      </header>

      {/* ─── メインコンテンツ ─── */}
      <main className="flex-1 overflow-hidden">
        <KijunViewerWrapper />
      </main>
    </div>
  )
}
