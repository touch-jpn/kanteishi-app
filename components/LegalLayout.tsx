'use client'

import Link from 'next/link'

interface Props {
  title: string
  updatedAt: string
  children: React.ReactNode
}

export default function LegalLayout({ title, updatedAt, children }: Props) {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white">
      <header className="px-5 pt-8 pb-5 border-b border-gray-100">
        <Link href="/" className="text-xs text-blue-600 font-bold">← トップへ戻る</Link>
        <h1 className="text-xl font-black text-gray-900 mt-3">{title}</h1>
        <p className="text-xs text-gray-400 mt-1">最終更新：{updatedAt}</p>
      </header>
      <main className="px-5 py-6 space-y-6 text-sm text-gray-700 leading-relaxed">
        {children}
      </main>
      <footer className="px-5 py-8 border-t border-gray-100 text-center text-xs text-gray-400">
        © 2025 不動産鑑定士 暗記アプリ
      </footer>
    </div>
  )
}
