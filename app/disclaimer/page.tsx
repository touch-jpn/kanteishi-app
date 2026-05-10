import LegalLayout from '@/components/LegalLayout'

export default function DisclaimerPage() {
  return (
    <LegalLayout title="免責事項" updatedAt="2025年5月">

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-amber-800 text-xs font-bold">
          本サービスはβ版として提供しており、内容の正確性・完全性を保証するものではありません。
        </p>
      </div>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">1. 学習効果・試験合格の保証なし</h2>
        <p>
          本サービスは不動産鑑定評価基準の学習を支援するツールです。本サービスの利用によって、学習効果や不動産鑑定士試験への合格を保証するものではありません。
          試験対策は本サービスのみに依存せず、公式テキストや専門の講座と組み合わせてご利用ください。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">2. コンテンツの正確性</h2>
        <p>
          問題文・解答・解説の内容については正確を期すよう努めていますが、誤りが含まれる可能性があります。
          本サービスの情報を利用したことによって生じた損害について、運営者は責任を負いません。
          誤りを発見した場合はお知らせください。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">3. 法改正・基準改定への対応</h2>
        <p>
          不動産鑑定評価基準の改定や関連法令の変更があった場合、本サービスの内容が最新の基準と異なる場合があります。
          改定内容への即時対応は保証しておらず、常に最新の公式資料を確認されることをお勧めします。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">4. サービスの継続性</h2>
        <p>
          本サービスはβ版として個人が運営しており、予告なくサービスを停止・終了する場合があります。
          また、システム障害・メンテナンス等により一時的に利用できない場合があります。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">5. 外部サービスに起因する障害</h2>
        <p>
          本サービスはSupabase・Vercel等の外部サービスを利用しています。これらの障害・仕様変更等に起因する問題については、運営者の責任の範囲外となります。
        </p>
      </section>

    </LegalLayout>
  )
}
