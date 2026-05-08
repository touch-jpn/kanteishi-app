'use client'

import type { PremiumState } from './types'

const PREMIUM_KEY = 'kanteishi_premium'

export function loadPremiumState(): PremiumState {
  if (typeof window === 'undefined') return { isPremium: false, planType: null, expiresAt: null }
  try {
    const raw = localStorage.getItem(PREMIUM_KEY)
    return raw ? JSON.parse(raw) : { isPremium: false, planType: null, expiresAt: null }
  } catch {
    return { isPremium: false, planType: null, expiresAt: null }
  }
}

export function savePremiumState(state: PremiumState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREMIUM_KEY, JSON.stringify(state))
}

export function isPremiumActive(): boolean {
  const state = loadPremiumState()
  if (!state.isPremium || !state.expiresAt) return false
  return state.expiresAt >= new Date().toISOString().split('T')[0]
}

export function getRemainingDays(): number | null {
  const state = loadPremiumState()
  if (!state.isPremium || !state.expiresAt) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expires = new Date(state.expiresAt)
  const diff = expires.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function startTrial(days = 14): void {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)
  savePremiumState({
    isPremium: true,
    planType: 'trial',
    expiresAt: expiresAt.toISOString().split('T')[0],
  })
}

export function activatePlan(planType: 'monthly' | 'yearly'): void {
  const expiresAt = new Date()
  if (planType === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }
  savePremiumState({
    isPremium: true,
    planType,
    expiresAt: expiresAt.toISOString().split('T')[0],
  })
}

export function cancelPremium(): void {
  savePremiumState({ isPremium: false, planType: null, expiresAt: null })
}
