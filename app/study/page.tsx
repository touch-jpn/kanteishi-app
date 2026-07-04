'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { chapterList, getQuestionsByChapter, questions } from '@/lib/questions'
import { getQuestionStats, getRecommendedQuestions } from '@/lib/storage'
import { isPremiumActive, getRemainingDays } from '@/lib/premium'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useStats } from '@/lib/hooks/useStats'
import { useDailyGoal, GOAL_OPTIONS } from '@/lib/hooks/useDailyGoal'
import QuestionCard from '@/components/QuestionCard'
import StudyScreen from '@/components/StudyScreen'
import PremiumGate from '@/components/PremiumGate'
import ReferenceView from '@/components/ReferenceView'
import StudyCalendar from '@/components/StudyCalendar'
import type { Question } from '@/lib/types'

type TopView = 'home' | 'study' | 'reference'
type Tab = 'sōron' | 'kakuron'
type SelectionMode = 'manual' | 'auto' | 'recommended' | 'review'

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const stats = useStats(user)
  const { dailyGoal, setDailyGoal } = useDailyGoal()
  const goalAchieved   = stats.todayCount >= dailyGoal
  const remainingToday = Math.max(0, dailyGoal - stats.todayCount)

  const [topView, setTopView] = useState<TopView>('home')
  const [tab, setTab] = useState<Tab>('sōron')
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('manual')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)

  const sessionUsedIds = useRef(new Set<string>())

  const [recommended, setRecommended] = useState<{
    dueIds: string[]; weakIds: string[]; newIds: string[]
  }>({ dueIds: [], weakIds: [], newIds: [] })

  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([])
  const [reviewQueueIds, setReviewQueueIds] = useState<string[]>([])
  const [loadingReview, setLoadingReview] = useState(false)

  const [studyQueue, setStudyQueue] = useState<Question[]>([])
  const [studyIndex, setStudyIndex] = useState(0)
  const isReviewSession = useRef(false)
  const currentReviewIds = useRef<string[]>([])

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

  const loadReviewQueue = useCallback(async () => {
    if (!user) return
    setLoadingReview(true)
    const jstOffset = 9 * 60 * 60 * 1000
    const nowJST = new Date(Date.now() + jstOffset)
    const today = nowJST.toISOString().slice(0, 10)

    const { data } = await supabase
      .from('review_queue')
      .select('id, question_slug')
      .eq('user_id', user.id)
      .eq('completed', false)
      .lte('review_date', today)
      .order('review_date', { ascending: true })

    if (!data || data.length === 0) {
      setReviewQuestions([])
      setReviewQueueIds([])
      setLoadingReview(false)
      return
    }

    const ids = data.map(d => d.id as string)
    const matched = data
      .map(d => questions.find(q => q.slug === d.question_slug))
      .filter(Boolean) as Question[]

    setReviewQuestions(matched)
    setReviewQueueIds(ids)
    setLoadingReview(false)
  }, [user])

  useEffect(() => {
    if (selectionMode === 'review' && topView === 'study') {
      loadReviewQueue()
    }
  }, [selectionMode, topView, loadReviewQueue])

  const currentChapters = chapterList.filter(c => c.section === tab)
  const chapterQuestions = getQuestionsByChapter(tab, selectedChapter)
  const currentChapterEntry = currentChapters.find(c => c.chapterNum === selectedChapter)
  const chapterKey = currentChapterEntry?.id ?? ''
  const chapterLabel = currentChapterEntry?.label ?? ''

  function startManual(q: Question) {
    setStudyQueue([q]); setStudyIndex(0)
    isReviewSession.current = false
  }

  function startRandom1() {
    const unused = questions.filter(q => !sessionUsedIds.current.has(q.id))
    const pool = unused.length > 0 ? unused : questions
    if (unused.length === 0) sessionUsedIds.current.clear()
    const picked = pool[Math.floor(Math.random() * pool.length)]
    sessionUsedIds.current.add(picked.id)
    setStudyQueue([picked]); setStudyIndex(0)
    isReviewSession.current = false
  }

  function startRandom5() {
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    setStudyQueue(shuffled.slice(0, 5)); setStudyIndex(0)
    isReviewSession.current = false
  }

  function startRecommended() {
    const ids = [...recommended.dueIds, ...recommended.weakIds, ...recommended.newIds]
    const qs = ids.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[]
    if (!qs.length) return
    setStudyQueue(qs); setStudyIndex(0)
    isReviewSession.current = false
  }

  function startReview() {
    if (!reviewQuestions.length) return
    currentReviewIds.current = [...reviewQueueIds]
    setStudyQueue([...reviewQuestions]); setStudyIndex(0)
    isReviewSession.current = true
  }

  // 戻るボタン → 選択画面へ戻る（次の問題へは進まない）
  function handleStudyBack() {
    setStudyQueue([]); setStudyIndex(0)
    isReviewSession.current = false
    currentReviewIds.current = []
  }

  // 次へボタン → キューを進める
  async function handleStudyNext() {
    const next = studyIndex + 1
    if (next < studyQueue.length) {
      setStudyIndex(next)
    } else {
      if (isReviewSession.current && currentReviewIds.current.length > 0 && user) {
        await supabase
          .from('review_queue')
          .update({ completed: true })
          .in('id', currentReviewIds.current)
      }
      setStudyQueue([]); setStudyIndex(0)
      isReviewSession.current = false
      currentReviewIds.current = []
      if (selectionMode === 'review') loadReviewQueue()
    }
  }

  const currentQuestion = studyQueue[studyIndex] ?? null
  if (currentQuestion) {
    return (
      <StudyScreen
        question={currentQuestion}
        onBack={handleStudyBack}
        onNext={handleStudyNext}
        onHome={() => router.push('/')}
        queueInfo={studyQueue.length > 1 ? { current: studyIndex + 1, total: studyQueue.length } : undefined}
        isPremium={isPremium}
        user={user}
      />
    )
  }

  const totalRecommended = recommended.dueIds.length + recommended.weakIds.length + recommended.newIds.length

  // ────────────────────────────────────────
  // ホーム画面
  // ────────────────────────────────────────
  if (topView === 'home') {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 sticky top-0 z-20">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-black">鑑</span>
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 leading-tight">不動産鑑定士</p>
                <p className="text-xs text-gray-400 leading-tight">暗記アプリ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-400 px-2 py-1">
                  ログアウト
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login?returnTo=/study')}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 bg-blue-50"
                >
                  ログイン
                </button>
              )}
            </div>
          </div>

          {/* 学習統計バー */}
          {user && stats.totalCount > 0 && (
            <div className="pb-2 space-y-1.5">
              <div className="flex items-center gap-3">
                {stats.streak > 0 && (
                  <span className="text-xs font-bold text-orange-500">🔥 {stats.streak}日連続</span>
                )}
                {goalAchieved ? (
                  <span className="text-xs font-bold text-green-600">✅ 今日の目標達成！</span>
                ) : (
                  <span className="text-xs text-gray-400">
                    今日あと <strong className="text-blue-600">{remainingToday}</strong> 問
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>累計 <strong className="text-gray-600">{stats.totalCount}</strong> 問</span>
                  <span>正答率 <strong className={
                    stats.correctRate >= 70 ? 'text-green-600'
                    : stats.correctRate >= 50 ? 'text-yellow-500'
                    : 'text-red-500'
                  }>{stats.correctRate}%</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-300">目標</span>
                  {GOAL_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => setDailyGoal(g)}
                      className={`text-xs w-7 py-0.5 rounded-full font-bold text-center transition-colors ${
                        dailyGoal === g ? 'bg-blue-600 text-white' : 'text-gray-400 border border-gray-200 active:bg-gray-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="px-4 pt-6 pb-10 space-y-4">
          <p className="text-xs text-gray-400 px-1">何をしますか？</p>

          {/* 問題を解く */}
          <button
            onClick={() => setTopView('study')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left active:bg-gray-50 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-3xl flex-shrink-0">
                📝
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900 text-base">問題を解く</p>
                <p className="text-sm text-gray-500 mt-0.5">穴埋め・全文入力で学習する</p>
                <p className="text-xs text-gray-400 mt-1">全200問 · 総論＋各論</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-300 flex-shrink-0">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* 基準・留意事項 */}
          <button
            onClick={() => setTopView('reference')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left active:bg-gray-50 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-3xl flex-shrink-0">
                📖
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900 text-base">基準・留意事項</p>
                <p className="text-sm text-gray-500 mt-0.5">不動産鑑定評価基準の全文を閲覧</p>
                <p className="text-xs text-gray-400 mt-1">総論＋各論 · 全文閲覧</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-300 flex-shrink-0">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* 基準ビューア */}
          <a
            href="/anki"
            className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left active:bg-gray-50 shadow-sm flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center text-3xl flex-shrink-0">
              📕
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-900 text-base">基準ノート</p>
              <p className="text-sm text-gray-500 mt-0.5">基準全文 × 赤シートで完全暗記</p>
              <p className="text-xs text-gray-400 mt-1">総論＋各論 · L1 / L2 / L3</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-300 flex-shrink-0">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>

          {/* 学習カレンダー */}
          {user && stats.answerDates.length > 0 && (
            <StudyCalendar answerDates={stats.answerDates} />
          )}
        </main>
      </div>
    )
  }

  // ────────────────────────────────────────
  // 基準・留意事項画面
  // ────────────────────────────────────────
  if (topView === 'reference') {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 h-14">
            <button
              onClick={() => setTopView('home')}
              className="text-gray-500 p-1 -ml-1"
              aria-label="戻る"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <p className="text-sm font-bold text-gray-800 flex-1">基準・留意事項</p>
          </div>
          <div className="flex">
            {(['sōron', 'kakuron'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedChapter(1) }}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
                }`}
              >
                {t === 'sōron' ? '総　論' : '各　論'}
              </button>
            ))}
          </div>
        </header>

        <div className="bg-white border-b border-gray-100">
          <div className="flex overflow-x-auto gap-1.5 px-4 py-2.5 scrollbar-none">
            {currentChapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapter(ch.chapterNum)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedChapter === ch.chapterNum ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                第{ch.chapterNum}章
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full">
            <ReferenceView chapterKey={chapterKey} chapterLabel={chapterLabel} />
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────
  // 問題を解く画面
  // ────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sticky top-0 z-20">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTopView('home')}
              className="text-gray-500 p-1 -ml-1"
              aria-label="ホームへ"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <p className="text-sm font-bold text-gray-800">問題を解く</p>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-400 px-2 py-1">
                ログアウト
              </button>
            ) : (
              <button
                onClick={() => router.push('/login?returnTo=/study')}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 bg-blue-50"
              >
                ログイン
              </button>
            )}
          </div>
        </div>

        {/* 総論/各論タブ */}
        <div className="flex">
          {(['sōron', 'kakuron'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedChapter(1) }}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
              }`}
            >
              {t === 'sōron' ? '総　論' : '各　論'}
            </button>
          ))}
        </div>
      </header>

      {/* 選択モードタブ */}
      <div className="bg-white border-b border-gray-100 flex shadow-sm">
        {([
          { key: 'manual',      label: '問題選択', icon: '📖' },
          { key: 'auto',        label: 'ランダム', icon: '🎲' },
          { key: 'recommended', label: 'おすすめ', icon: '⭐' },
          { key: 'review',      label: '復習',     icon: '🔁' },
        ] as { key: SelectionMode; label: string; icon: string }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setSelectionMode(key)}
            className={`flex-1 py-2 text-xs font-bold flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
              selectionMode === key ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500'
            }`}
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* 問題選択モード */}
      {selectionMode === 'manual' && (
        <>
          <div className="bg-white border-b border-gray-100">
            <div className="flex overflow-x-auto gap-1.5 px-4 py-2.5 scrollbar-none">
              {currentChapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapter(ch.chapterNum)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedChapter === ch.chapterNum ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  第{ch.chapterNum}章
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 pt-3 pb-24 space-y-2">
            {chapterQuestions.length === 0 ? (
              <div className="text-center text-gray-300 py-16 text-sm">問題データなし</div>
            ) : (
              <>
                <p className="text-xs text-gray-400 pb-1">
                  ※難易度はTACテキストをベースに鑑定士試験合格者が重要度・頻出度をもとに設定しています
                </p>
                {chapterQuestions.map(q => (
                  <QuestionCard key={q.id} question={q} stats={getQuestionStats(q.id)} onStart={() => startManual(q)} />
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* ランダムモード */}
      {selectionMode === 'auto' && (
        <div className="px-4 pt-6 pb-24 space-y-4">
          <p className="text-xs text-gray-400 text-center">全{questions.length}問（総論＋各論）からランダム出題</p>
          <button onClick={startRandom1} className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left active:bg-gray-50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">🎲</div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">ランダム（1問）</p>
                <p className="text-sm text-gray-500 mt-0.5">全問からランダムに1問。解いた問題は後回しにします</p>
              </div>
            </div>
          </button>
          <button onClick={startRandom5} className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left active:bg-gray-50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">🎯</div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">ランダム（5問）</p>
                <p className="text-sm text-gray-500 mt-0.5">総論・各論混在で5問セット</p>
              </div>
            </div>
          </button>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1">
            <p>・総論 {questions.filter(q => q.section === 'sōron').length}問 ＋ 各論 {questions.filter(q => q.section === 'kakuron').length}問 の全{questions.length}問が対象</p>
            <p>・ランダム1問は全問解くまで同じ問題が出にくくなります</p>
          </div>
        </div>
      )}

      {/* おすすめモード */}
      {selectionMode === 'recommended' && (
        <div className="px-4 pt-5 pb-24 space-y-4">
          {!isPremium ? (
            <PremiumGate feature="おすすめ問題（忘却曲線）" onUpgrade={() => router.push('/premium')} />
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
                <button onClick={startRecommended} className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl active:bg-amber-600">
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
            </>
          )}
        </div>
      )}

      {/* 復習モード */}
      {selectionMode === 'review' && (
        <div className="px-4 pt-5 pb-24 space-y-4">
          {!user ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
              <p className="text-2xl">🔒</p>
              <p className="font-bold text-amber-800">ログインが必要です</p>
              <p className="text-sm text-amber-600">問題後に「明日また復習する」を押した問題がここに表示されます</p>
              <button
                onClick={() => router.push('/login?returnTo=/study')}
                className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm active:bg-amber-600"
              >
                ログイン →
              </button>
            </div>
          ) : loadingReview ? (
            <div className="text-center py-16 text-sm text-gray-400">読み込み中...</div>
          ) : reviewQuestions.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-3xl">📅</p>
              <p className="font-bold text-gray-700">復習予定の問題はありません</p>
              <p className="text-sm text-gray-400">
                問題を解いた後に「明日また復習する」を押すと<br />翌日ここに表示されます
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">復習予定：{reviewQuestions.length}問</p>
                <button
                  onClick={startReview}
                  className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm active:bg-blue-700"
                >
                  🔁 まとめて復習
                </button>
              </div>
              <div className="space-y-2">
                {reviewQuestions.map(q => (
                  <QuestionCard key={q.id} question={q} stats={getQuestionStats(q.id)} onStart={() => startManual(q)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
