import LegalLayout from '@/components/LegalLayout'

export default function TermsPage() {
  return (
    <LegalLayout title="利用規約" updatedAt="2025年5月">

      <section>
        <h2 className="font-bold text-gray-900 mb-2">1. 本規約について</h2>
        <p>
          本規約は、不動産鑑定士 暗記アプリ（以下「本サービス」）の利用条件を定めるものです。
          本サービスをご利用いただくことで、本規約に同意いただいたものとみなします。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">2. 利用者の責任</h2>
        <p>
          本サービスの利用は、利用者ご自身の判断と責任において行ってください。
          本サービスの利用に起因して生じた損害について、運営者は責任を負いません。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">3. 禁止事項</h2>
        <p>以下の行為を禁止します。</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
          <li>1つのアカウントを複数人で共有すること</li>
          <li>他のユーザーへの不正アクセスや妨害行為</li>
          <li>本サービスのコンテンツの無断転載・複製・配布</li>
          <li>サービスへの過度な負荷をかける行為</li>
          <li>その他、法令または公序良俗に反する行為</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">4. サービスの変更・停止</h2>
        <p>
          運営者は、事前の告知なくサービスの内容を変更、または提供を停止することがあります。
          これによって利用者に損害が生じた場合であっても、運営者は責任を負いません。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">5. 著作権</h2>
        <p>
          本サービス内の問題文・解答・解説・UIデザイン等に関する著作権は、運営者または正当な権利者に帰属します。
          不動産鑑定評価基準の原文は国土交通省が定めるものですが、本サービスにおける編集・整理・解説部分については運営者に権利があります。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">6. 規約の変更</h2>
        <p>
          本規約は、必要に応じて予告なく変更することがあります。変更後も本サービスをご利用の場合、変更後の規約に同意いただいたものとみなします。
        </p>
      </section>

    </LegalLayout>
  )
}
