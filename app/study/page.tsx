'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { chapterList, getQuestionsByChapter, questions } from '@/lib/questions'
import { getQuestionStats, getRecommendedQuestions } from '@/lib/storage'
import { isPremiumActive, getRemainingDays } from '@/lib/premium'
import QuestionCard from '@/components/QuestionCard'
import StudyScreen from '@/components/StudyScreen'
import PremiumGate from '@/components/PremiumGate'
import ReferenceView from '@/components/ReferenceView'
import type { Question } from '@/lib/types'

type Tab = 'sōron' | 'kakuron'
type SelectionMode = 'manual' | 'auto' | 'recommended'
type ManualSubTab = 'list' | 'reference'

const AUTO_COUNTS = [10, 20, 50, 0]

export default function Home() {
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('sōron')
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('manual')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [manualSubTab, setManualSubTab] = useState<ManualSubTab>('list')

  const [autoChapterNums, setAutoChapterNums] = useState<number[]>([])
  const [autoCount, setAutoCount] = useState<number>(20)

  const [recommended, setRecommended] = useState<{
    dueIds: string[]; weakIds: string[]; newIds: string[]
  }>({ dueIds: [], weakIds: [], newIds: [] })

  const [studyQueue, setStudyQueue] = useState<Question[]>([])
  const [studyIndex, setStudyIndex] = useState(0)

  const [isPremium, setIsPremium] = useState(false)
  const [remainingDays, setRemainingDays] = useState<number | null>(null)

  useEffect(() => {
    setIsPremium(isPremiumActive())
    setRemainingDays(getRemainingDays())
  }, [studyQueue])

  useEffect(() => {
    const allIds = questions.filter(q => q.section === tab).map(q => q.id)
    setRecommended(getRecommendedQuestions(allIds))
  }, [tab, studyQueue])

  const currentChapters = chapterList.filter(c => c.section === tab)
  const chapterQuestions = getQuestionsByChapter(tab, selectedChapter)
  const currentChapterEntry = currentChapters.find(c => c.chapterNum === selectedChapter)
  const chapterKey = currentChapterEntry?.id ?? ''
  const chapterLabel = currentChapterEntry?.label ?? ''

  // ── スタート ────────────────────────────────────────────

  function startManual(q: Question) { setStudyQueue([q]); setStudyIndex(0) }

  function startAuto() {
    const pool = questions.filter(q => {
      if (q.section !== tab) return false
      return autoChapterNums.length > 0 ? autoChapterNums.includes(q.chapterNum) : true
    })
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const count = autoCount === 0 ? shuffled.length : autoCount
    setStudyQueue(shuffled.slice(0, count))
    setStudyIndex(0)
  }

  function startRecommended() {
    const ids = [...recommended.dueIds, ...recommended.weakIds, ...recommended.newIds]
    const qs = ids.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[]
    if (!qs.length) return
    setStudyQueue(qs); setStudyIndex(0)
  }

  function handleStudyBack() {
    const next = studyIndex + 1
    if (next < studyQueue.length) { setStudyIndex(next) } else { setStudyQueue([]); setStudyIndex(0) }
  }

  // ── 学習中 ──────────────────────────────────────────────

  const currentQuestion = studyQueue[studyIndex] ?? null
  if (currentQuestion) {
    return (
      <StudyScreen
        question={currentQuestion}
        onBack={handleStudyBack}
        queueInfo={studyQueue.length > 1 ? { current: studyIndex + 1, total: studyQueue.length } : undefined}
        isPremium={isPremium}
      />
    )
  }

  const totalRecommended = recommended.dueIds.length + recommended.weakIds.length + recommended.newIds.length

  function toggleAutoChapter(num: number) {
    setAutoChapterNums(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num])
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      {/* ── ヘッダー ── */}
      <header className="bg-white border-b border-gray-200 px-4 sticky top-0 z-20">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center active:bg-blue-700"
              aria-label="ホームへ"
            >
              <span className="text-white text-xs font-black">鑑</span>
            </button>
            <div>
              <p className="text-sm font-black text-gray-800 leading-tight">不動産鑑定士</p>
              <p className="text-xs text-gray-400 leading-tight">暗記アプリ</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/premium')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              isPremium
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {isPremium ? `⭐ PRO · 残${remainingDays}日` : '⭐ PRO'}
          </button>
        </div>

        {/* 総論/各論 タブ */}
        <div className="flex">
          {(['sōron', 'kakuron'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedChapter(1); setAutoChapterNums([]) }}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'sōron' ? '総　論' : '各　論'}
            </button>
          ))}
        </div>
      </header>

      {/* ── 選択モード タブ ── */}
      <div className="bg-white border-b border-gray-100 flex sticky top-[calc(3.5rem+2.5rem)] z-10 shadow-sm">
        {([
          { key: 'manual',      label: '問題選択', icon: '📖' },
          { key: 'auto',        label: 'ランダム', icon: '🎲' },
          { key: 'recommended', label: 'おすすめ', icon: '⭐' },
        ] as { key: SelectionMode; label: string; icon: string }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setSelectionMode(key)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors flex flex-col items-center gap-0.5 border-b-2 ${
              selectionMode === key
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500'
            }`}
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── 問題選択モード ── */}
      {selectionMode === 'manual' && (
        <>
          {/* 章セレクタ */}
          <div className="bg-white border-b border-gray-100">
            <div className="flex overflow-x-auto gap-1.5 px-4 py-2.5 scrollbar-none">
              {currentChapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => { setSelectedChapter(ch.chapterNum); setManualSubTab('list') }}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedChapter === ch.chapterNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  第{ch.chapterNum}章
                </button>
              ))}
            </div>
          </div>

          {/* 問題一覧 / 基準・留意事項 サブタブ */}
          <div className="bg-white border-b border-gray-100 flex">
            {([
              { key: 'list',      label: '問題一覧' },
              { key: 'reference', label: '基準・留意事項' },
            ] as { key: ManualSubTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setManualSubTab(key)}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                  manualSubTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {manualSubTab === 'list' && (
            <div className="px-4 pt-3 pb-24 space-y-2">
              {chapterQuestions.length === 0 ? (
                <div className="text-center text-gray-300 py-16 text-sm">問題データなし</div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 pb-1">
                    ※難易度はTACテキストをベースに鑑定士試験合格者が重要度・頻出度をもとに設定しています
                  </p>
                  {chapterQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      stats={getQuestionStats(q.id)}
                      onStart={() => startManual(q)}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {manualSubTab === 'reference' && (
            <div className="h-[calc(100vh-220px)]">
              <ReferenceView chapterKey={chapterKey} chapterLabel={chapterLabel} />
            </div>
          )}
        </>
      )}

      {/* ── ランダムモード ── */}
      {selectionMode === 'auto' && (
        <div className="px-4 pt-5 pb-24 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide">対象章（未選択＝全章）</p>
            <div className="flex flex-wrap gap-2">
              {currentChapters.map(ch => {
                const selected = autoChapterNums.includes(ch.chapterNum)
                return (
                  <button
                    key={ch.id}
                    onClick={() => toggleAutoChapter(ch.chapterNum)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                      selected ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 active:bg-gray-50'
                    }`}
                  >
                    第{ch.chapterNum}章
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide">問題数</p>
            <div className="flex gap-2">
              {AUTO_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setAutoCount(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    autoCount === n ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 active:bg-gray-50'
                  }`}
                >
                  {n === 0 ? '全て' : `${n}問`}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const pool = questions.filter(q => {
              if (q.section !== tab) return false
              return autoChapterNums.length > 0 ? autoChapterNums.includes(q.chapterNum) : true
            })
            const actual = autoCount === 0 ? pool.length : Math.min(autoCount, pool.length)
            return (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                対象 <strong>{pool.length}問</strong> から <strong>{actual}問</strong> をランダム出題
              </div>
            )
          })()}

          <button
            onClick={startAuto}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-base active:bg-blue-700"
          >
            🎲 スタート
          </button>
        </div>
      )}

      {/* ── おすすめモード ── */}
      {selectionMode === 'recommended' && (
        <div className="px-4 pt-5 pb-24 space-y-4">
          {!isPremium ? (
            <PremiumGate
              feature="おすすめ問題（忘却曲線）"
              onUpgrade={() => router.push('/premium')}
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '今日の復習', count: recommended.dueIds.length, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                  { label: '弱点問題', count: recommended.weakIds.length, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
                  { label: '未学習', count: recommended.newIds.length, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} className={`border rounded-xl p-3 text-center ${bg}`}>
                    <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {totalRecommended === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-3xl">🎉</p>
                  <p className="font-bold text-gray-700">今日のおすすめ問題はありません</p>
                  <p className="text-sm text-gray-400">ランダムモードで練習を続けましょう</p>
                </div>
              ) : (
                <button
                  onClick={startRecommended}
                  className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl active:bg-amber-600"
                >
                  ⭐ スタート（{totalRecommended}問）
                </button>
              )}

              {recommended.dueIds.length > 0 && (
                <section className="space-y-2">
                  <p className="text-xs font-bold text-red-400">🔴 今日の復習</p>
                  {recommended.dueIds.map(id => questions.find(q => q.id === id)!).map(q => (
                    <QuestionCard key={q.id} question={q} stats={getQuestionStats(q.id)} onStart={() => startManual(q)} />
                  ))}
                </section>
              )}

              {recommended.weakIds.length > 0 && (
                <section className="space-y-2">
                  <p className="text-xs font-bold text-orange-400">🟠 弱点問題（平均60点未満）</p>
                  {recommended.weakIds.map(id => questions.find(q => q.id === id)!).map(q => (
                    <QuestionCard key={q.id} question={q} stats={getQuestionStats(q.id)} onStart={() => startManual(q)} />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
