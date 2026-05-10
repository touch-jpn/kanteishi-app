import LegalLayout from '@/components/LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalLayout title="プライバシーポリシー" updatedAt="2025年5月">

      <section>
        <h2 className="font-bold text-gray-900 mb-2">1. 収集する情報</h2>
        <p>本サービスでは、以下の情報を収集・保存します。</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
          <li>メールアドレス（アカウント登録時）</li>
          <li>回答履歴（正解・不正解の記録）</li>
          <li>ブックマーク情報</li>
          <li>学習モード・回答スコアなどの学習データ</li>
        </ul>
        <p className="mt-2 text-gray-500">
          ゲスト利用（ログインなし）の場合、学習データはお使いのブラウザ内にのみ保存され、サーバーには送信されません。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">2. 利用目的</h2>
        <ul className="space-y-1 list-disc list-inside text-gray-600">
          <li>サービスの提供・維持・改善</li>
          <li>学習進捗の管理・表示</li>
          <li>不正利用の防止</li>
          <li>サービスに関するご連絡（重要な変更の通知等）</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">3. 第三者への提供</h2>
        <p>
          収集した個人情報は、法令に基づく場合を除き、第三者に提供・販売することはありません。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">4. 外部サービスの利用</h2>
        <p>本サービスは以下の外部サービスを使用しています。</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
          <li><strong>Supabase</strong>（データベース・認証）：ユーザー情報・学習データを保存</li>
          <li><strong>Vercel</strong>（ホスティング）：アプリの配信</li>
        </ul>
        <p className="mt-2 text-gray-500">
          各サービスのプライバシーポリシーについては、各社の公式サイトをご確認ください。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">5. データの保管と削除</h2>
        <p>
          アカウント情報および学習データは、サービス提供に必要な期間保管します。
          アカウント削除をご希望の場合は、お問い合わせよりご連絡ください。速やかに対応いたします。
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">6. お問い合わせ</h2>
        <p>
          プライバシーに関するご質問・ご要望は、以下よりお問い合わせください。
        </p>
        <p className="mt-2 text-gray-500">
          ※現在β運用中のため、お問い合わせ窓口は準備中です。
        </p>
      </section>

    </LegalLayout>
  )
}
