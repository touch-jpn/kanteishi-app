'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

const features = [
  {
    icon: '📝',
    title: '穴埋めモード（無料）',
    desc: '空欄をタイプして基準のキーワードを記憶。全200問、無制限で使えます。',
  },
  {
    icon: '✍️',
    title: '全文入力モード（PRO）',
    desc: '基準を一から書いて採点。キーワード得点＋文章一致率の2段階で採点します。',
  },
  {
    icon: '⭐',
    title: 'おすすめ問題（PRO）',
    desc: 'SM-2忘却曲線アルゴリズムで最適なタイミングに復習問題を自動提示します。',
  },
  {
    icon: '📖',
    title: '基準・留意事項の確認',
    desc: '各章の不動産鑑定評価基準の原文と留意事項をいつでも読み返せます。',
  },
]

const steps = [
  { num: '01', title: '章を選ぶ', desc: '総論1〜9章・各論1〜3章から学習したい章を選択します。' },
  { num: '02', title: 'モードを選ぶ', desc: '穴埋め（手入力）か全文入力のどちらかで問題に答えます。' },
  { num: '03', title: '採点・復習', desc: '採点後に模範解答と比較。正答率に応じて次回の復習タイミングが決まります。' },
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white">

      {/* ヘッダー */}
      <header className="px-5 pt-10 pb-8 text-center border-b border-gray-100">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
          不動産鑑定評価基準 · 200問収録
        </div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">
          不動産鑑定士<br />暗記アプリ
        </h1>
        <p className="text-gray-500 text-sm mt-3 leading-relaxed">
          不動産鑑定評価基準をキーワード穴埋めと<br />全文入力で効率よく暗記できるアプリです。
        </p>

        <button
          onClick={() => router.push('/study')}
          className="mt-6 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-base active:bg-blue-700 shadow-md"
        >
          学習をはじめる →
        </button>
        <p className="text-xs text-gray-400 mt-2">登録不要 · 穴埋めモードは完全無料</p>
      </header>

      {/* 使い方 */}
      <section className="px-5 py-8 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">使い方</h2>
        <div className="space-y-5">
          {steps.map(s => (
            <div key={s.num} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black">
                {s.num}
              </div>
              <div>
                <p className="font-bold text-gray-800">{s.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="px-5 py-8 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">機能一覧</h2>
        <div className="space-y-3">
          {features.map(f => (
            <div key={f.title} className="flex gap-4 items-start bg-gray-50 rounded-2xl px-4 py-4">
              <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <p className="font-bold text-sm text-gray-800">{f.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 無料 vs PRO */}
      <section className="px-5 py-8 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">プラン比較</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* 無料 */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <p className="text-sm font-black text-gray-700 mb-3">無料プラン</p>
            <ul className="space-y-2 text-sm">
              {[
                ['✓', '穴埋めモード（無制限）', true],
                ['✓', '基準・留意事項確認', true],
                ['–', '全文入力モード', false],
                ['–', 'おすすめ問題', false],
                ['–', 'メモ機能', false],
              ].map(([mark, label, ok]) => (
                <li key={label as string} className={`flex items-start gap-2 ${ok ? 'text-gray-700' : 'text-gray-300'}`}>
                  <span className="flex-shrink-0 font-bold">{mark as string}</span>
                  <span>{label as string}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-sm font-black text-amber-700">⭐ PROプラン</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                ['✓', '穴埋めモード（無制限）'],
                ['✓', '基準・留意事項確認'],
                ['✓', '全文入力モード'],
                ['✓', 'おすすめ問題'],
                ['✓', 'メモ機能'],
              ].map(([mark, label]) => (
                <li key={label} className="flex items-start gap-2 text-amber-800">
                  <span className="flex-shrink-0 font-bold text-amber-500">{mark}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 font-bold mt-3">月額¥980 / 年額¥9,800</p>
            <p className="text-xs text-amber-500 mt-0.5">14日間無料体験あり</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/premium')}
          className="mt-4 w-full border border-amber-300 text-amber-700 font-bold py-3 rounded-xl text-sm active:bg-amber-50"
        >
          PROプランを見る →
        </button>
      </section>

      {/* 収録問題 */}
      <section className="px-5 py-8 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">収録内容</h2>
        <div className="space-y-2">
          {[
            { label: '総論 第1〜9章', count: 154, color: 'bg-blue-100 text-blue-700' },
            { label: '各論 第1〜3章', count: 46, color: 'bg-emerald-100 text-emerald-700' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{count}問</span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-blue-600 rounded-xl px-4 py-3">
            <span className="text-sm font-bold text-white">合計</span>
            <span className="text-sm font-extrabold text-white">200問</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          ※難易度の策定基準はTACテキストをベースに不動産鑑定士試験合格者が複数人で重要度・頻出度をもとに設定しています。
        </p>
      </section>

      {/* ボトムCTA */}
      <section className="px-5 py-10 text-center">
        <p className="font-bold text-gray-800 mb-1">まずは無料で始めよう</p>
        <p className="text-sm text-gray-400 mb-5">登録・ダウンロード不要。ブラウザですぐ使えます。</p>
        <button
          onClick={() => router.push('/study')}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-base active:bg-blue-700 shadow-md"
        >
          学習をはじめる →
        </button>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 px-5 py-6 text-center space-y-3">
        <div className="flex justify-center gap-5 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 underline-offset-2 hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="hover:text-gray-600 underline-offset-2 hover:underline">
            利用規約
          </Link>
          <Link href="/disclaimer" className="hover:text-gray-600 underline-offset-2 hover:underline">
            免責事項
          </Link>
        </div>
        <p className="text-xs text-gray-300">© 2025 不動産鑑定士 暗記アプリ</p>
      </footer>
    </div>
  )
}
