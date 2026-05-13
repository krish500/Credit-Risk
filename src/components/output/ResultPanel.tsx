'use client'

import { AlertCircle } from 'lucide-react'

import ShapStrengthChart from '@/components/charts/ShapStrengthChart'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { PredictionResult, ShapFactor } from '@/lib/types'
import { decisionTone, formatPercent } from '@/lib/utils'

import ScoreGauge from './ScoreGauge'
import WaterfallChart from './WaterfallChart'

interface Props {
  result: PredictionResult | null
  loading: boolean
  error: string | null
  borrowerLabel: string
  runVersion: number
}

function FactorCard({ factor }: { factor: ShapFactor }) {
  const increasing = factor.direction === 'increases_risk'
  const tone = increasing
    ? 'border-[#8a7a3a]/70 bg-[#2b2815]/80 text-[#f0e0a8]'
    : 'border-[#4a6b42]/70 bg-[#182418]/80 text-[#c8e6c0]'

  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--page-2)] px-3 py-2.5 transition-colors hover:border-[var(--border-warm)]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--fg)]">{factor.feature}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{factor.plain_english}</p>
      </div>
      <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums ${tone}`}>
        {factor.shap_value > 0 ? '+' : ''}
        {(factor.shap_value * 100).toFixed(1)}%
      </span>
    </li>
  )
}

export default function ResultPanel({ result, loading, error, borrowerLabel, runVersion }: Props) {
  if (loading) {
    return (
      <section className="surface flex min-h-[180px] items-center justify-center rounded-xl p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <LoadingSpinner />
          <p className="text-sm text-[var(--muted)]">Talking to the model…</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-5 text-[var(--fg)]">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-[var(--danger)]" size={18} />
          <div>
            <p className="font-serif text-lg">That didn&apos;t work</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{error}</p>
            <p className="mt-2 text-xs text-[var(--faint)]">Is the API up? I usually run uvicorn on :8001.</p>
          </div>
        </div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="surface flex min-h-[140px] items-center justify-center rounded-xl p-6 text-center">
        <p className="max-w-xs text-sm leading-relaxed text-[var(--muted)]">
          Nothing scored yet. Change the numbers (maybe add a label) and press <span className="text-[var(--accent-soft)]">Run the scorer</span>, and I&apos;ll show
          what changed.
        </p>
      </section>
    )
  }

  const topFactors = result.top_factors.slice(0, 5)
  const label = borrowerLabel.trim()

  return (
    <section key={runVersion} className="surface animate-pop rounded-xl p-5">
        <p className="text-sm text-[var(--muted)]">
          {label ? (
            <>
              For <span className="font-medium text-[var(--accent-soft)]">“{label}”</span>, here&apos;s what came back.
            </>
          ) : (
            <>Here&apos;s what came back for this app.</>
          )}
        </p>
        <div className="mt-4 flex items-start justify-between gap-3 border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--faint)]">Chance of default</p>
            <p className="mt-0.5 font-mono text-lg text-[var(--fg)]">{formatPercent(result.probability)}</p>
          </div>
          <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold capitalize ${decisionTone(result.decision)}`}>
            {result.decision}
          </span>
        </div>
        <div className="mt-5 flex flex-col items-center gap-4 border-t border-[var(--border)] pt-5">
          <ScoreGauge score={result.score} />
          <p className="w-full text-center text-sm italic text-[var(--muted)]">{result.decision_reason}</p>
          <ul className="w-full space-y-2">
            {topFactors.map((factor, index) => (
              <FactorCard key={`${index}-${factor.feature}`} factor={factor} />
            ))}
          </ul>
        </div>
      </section>
  )
}

export function ResultDetailsPanel({ result }: { result: PredictionResult | null }) {
  if (!result) return null

  const topFactors = result.top_factors.slice(0, 5)

  return (
    <section className="surface surface-interactive rounded-xl p-5">
      <h3 className="font-serif text-base text-[var(--fg)]">Why these five?</h3>
      <p className="mt-1 text-xs text-[var(--muted)]">SHAP in plain-ish language. Stronger bar = model cared more.</p>
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <ShapStrengthChart factors={topFactors} />
      </div>
      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-xs text-[var(--faint)]">Signed contributions vs baseline</p>
        <WaterfallChart factors={topFactors} baseValue={result.shap_base_value} />
      </div>
    </section>
  )
}
