'use client'

interface Props {
  feature: string
  onUpgrade: () => void
  onBack?: () => void
}

export default function PremiumGate({ feature, onUpgrade, onBack }: Props) {
  return (
    <div className="p-5 space-y-4">
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-4xl mb-3">⭐</p>
        <h3 className="text-xl font-bold text-gray-800">プレミアム機能</h3>
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-bold text-amber-700">{feature}</span>は<br />
          プレミアムプランでご利用いただけます
        </p>

        <div className="mt-4 bg-white rounded-xl p-4 border border-amber-100 text-left space-y-2">
          <p className="text-xs font-bold text-gray-500 mb-2">プレミアムで使える機能</p>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><span className="font-bold">全文入力モード</span>（無制限）</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><span className="font-bold">おすすめ問題</span>（忘却曲線ベース）</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><span className="font-bold">メモ機能</span>（問題ごとにメモを保存）</span>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="mt-5 w-full bg-amber-500 text-white font-bold py-4 rounded-2xl active:bg-amber-600 text-base shadow-md"
        >
          プランを見る →
        </button>
        <p className="text-xs text-gray-400 mt-2">14日間無料体験あり · いつでもキャンセル可</p>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="w-full py-3 text-sm text-gray-500 active:text-gray-700"
        >
          ← 戻る
        </button>
      )}
    </div>
  )
}
