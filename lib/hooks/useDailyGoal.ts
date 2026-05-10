'use client'

import { useState, useEffect } from 'react'

export type DailyGoal = 1 | 5 | 10
export const GOAL_OPTIONS: DailyGoal[] = [1, 5, 10]
const STORAGE_KEY = 'kanteishi_daily_goal'
const DEFAULT_GOAL: DailyGoal = 5

function parse(raw: string | null): DailyGoal {
  const n = Number(raw)
  return (GOAL_OPTIONS as number[]).includes(n) ? (n as DailyGoal) : DEFAULT_GOAL
}

export function useDailyGoal() {
  const [dailyGoal, setDailyGoalState] = useState<DailyGoal>(DEFAULT_GOAL)

  useEffect(() => {
    setDailyGoalState(parse(localStorage.getItem(STORAGE_KEY)))
  }, [])

  function setDailyGoal(goal: DailyGoal) {
    localStorage.setItem(STORAGE_KEY, String(goal))
    setDailyGoalState(goal)
  }

  return { dailyGoal, setDailyGoal }
}
