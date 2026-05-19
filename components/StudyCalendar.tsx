'use client'

/**
 * StudyCalendar — 直近 4 週間（28 日分）のミニカレンダー
 * Props:
 *   answerDates: string[]  // 'YYYY-MM-DD' 形式、学習済み日付一覧
 */

interface Props {
  answerDates: string[]
}

function getTodayJST(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function StudyCalendar({ answerDates }: Props) {
  const today = getTodayJST()
  const studiedSet = new Set(answerDates)

  // 今日を含む直近 28 日（今日が最後）
  const todayDate = new Date(today + 'T00:00:00Z')
  const days: string[] = []
  for (let i = 27; i >= 0; i--) {
    days.push(toYMD(addDays(todayDate, -i)))
  }

  // 週ごとに分割（7 日 × 4 行）
  const weeks: string[][] = []
  for (let w = 0; w < 4; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7))
  }

  const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

  // 4 週間中の学習日数
  const studiedCount = days.filter(d => studiedSet.has(d)).length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">学習カレンダー</p>
        <p className="text-xs text-gray-400">直近 28 日中 <span className="font-bold text-blue-600">{studiedCount}</span> 日</p>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 px-4 pb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 font-medium">{d}</div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="px-4 pb-4 space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(day => {
              const isToday = day === today
              const isStudied = studiedSet.has(day)
              const dayNum = parseInt(day.slice(8), 10)

              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isToday
                      ? isStudied
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : 'bg-white text-blue-600 ring-2 ring-blue-400'
                      : isStudied
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-50 text-gray-300'
                  }`}
                >
                  {dayNum}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
