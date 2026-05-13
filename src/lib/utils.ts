import { Decision } from './types'

export function scoreToColor(score: number): string {
  if (score >= 700) return 'var(--ok)'
  if (score >= 580) return 'var(--warn)'
  return 'var(--danger)'
}

export function decisionTone(decision: Decision): string {
  const tones: Record<Decision, string> = {
    approve: 'bg-[#1f3d28]/90 text-[#b8e6bf] border-[#3d6b47]',
    review: 'bg-[#3d3518]/90 text-[#f0e0a8] border-[#8a7a3a]',
    deny: 'bg-[#3d1f1c]/90 text-[#f0c8c0] border-[#8a4540]',
  }
  return tones[decision]
}

export function scoreToLabel(score: number): string {
  if (score >= 750) return 'Comfortable'
  if (score >= 700) return 'Looking good'
  if (score >= 650) return 'Middle of the road'
  if (score >= 580) return 'Shaky'
  return 'Rough'
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function shapColor(direction: 'increases_risk' | 'decreases_risk'): string {
  return direction === 'increases_risk' ? '#d4a84b' : '#4fb06d'
}
