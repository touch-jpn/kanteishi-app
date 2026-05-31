'use client'

import dynamic from 'next/dynamic'

// chapterTexts は大容量なので SSR を切ってクライアント側でレンダリング
const AnkiRedSheet = dynamic(
  () => import('@/components/anki/AnkiRedSheet'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-7 h-7 rounded-full border-4 border-gray-200 border-t-gray-600 animate-spin" />
        <p className="text-sm text-gray-400">読み込み中…</p>
      </div>
    ),
  },
)

export default function KijunViewerWrapper() {
  return <AnkiRedSheet />
}
