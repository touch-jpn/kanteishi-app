'use client'

interface ScoringInput {
  userAnswer: string
  correctAnswer: string
  keywords: { word: string; points: number }[]
}

interface ScoringResult {
  total: number
  keywordScore: number
  similarityScore: number
  matchedKeywords: string[]
  similarityRate: number
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/　/g, '')
    .replace(/[。、．，]/g, '')
    // （１）〜（９）と①〜⑨を統一
    .replace(/[①②③④⑤⑥⑦⑧⑨]/g, (c) => {
      const n = '①②③④⑤⑥⑦⑧⑨'.indexOf(c) + 1
      return `（${n}）`
    })
    // （一）〜（五）を数字形式に統一
    .replace(/（[一二三四五六七八九]）/g, (c) => {
      const n = '一二三四五六七八九'.indexOf(c[1]) + 1
      return `（${n}）`
    })
    .toLowerCase()
}

function calcSimilarity(a: string, b: string): number {
  const na = normalizeText(a)
  const nb = normalizeText(b)
  if (na === nb) return 1
  if (na.length === 0 || nb.length === 0) return 0

  // Longest Common Subsequence approach for Japanese text
  const lenA = na.length
  const lenB = nb.length
  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  )
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      if (na[i - 1] === nb[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  const lcs = dp[lenA][lenB]
  // Dice coefficient style: 2*LCS / (lenA + lenB)
  return (2 * lcs) / (lenA + lenB)
}

function calcSimilarityScore(rate: number): number {
  if (rate >= 0.95) return 50
  if (rate >= 0.90) return 40
  if (rate >= 0.80) return 30
  if (rate >= 0.70) return 20
  if (rate >= 0.60) return 10
  return 0
}

export function scoreAnswer(input: ScoringInput): ScoringResult {
  const { userAnswer, correctAnswer, keywords } = input
  const normalized = normalizeText(userAnswer)

  // Keyword scoring (max 50pt)
  const matchedKeywords: string[] = []
  let keywordScore = 0
  for (const kw of keywords) {
    if (normalized.includes(normalizeText(kw.word))) {
      matchedKeywords.push(kw.word)
      keywordScore += kw.points
    }
  }
  keywordScore = Math.min(keywordScore, 50)

  // Similarity scoring (max 50pt)
  const similarityRate = calcSimilarity(userAnswer, correctAnswer)
  const similarityScore = calcSimilarityScore(similarityRate)

  return {
    total: keywordScore + similarityScore,
    keywordScore,
    similarityScore,
    matchedKeywords,
    similarityRate,
  }
}
