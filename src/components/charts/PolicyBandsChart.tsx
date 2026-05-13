'use client'

import { Thresholds } from '@/lib/types'

const MIN = 300
const MAX = 850
const RANGE = MAX - MIN

function pct(value: number): number {
  return Math.max(0, Math.min(100, ((value - MIN) / RANGE) * 100))
}

interface Props {
  thresholds: Thresholds
  score?: number | null
  borrowerLabel?: string
}

export default function PolicyBandsChart({ thresholds, score, borrowerLabel }: Props) {
  const pDeny = pct(thresholds.deny)
  const pApprove = pct(thresholds.approve)
  const marker = score != null ? pct(score) : null
  const label = borrowerLabel?.trim()

  return (
    <section className="surface surface-interactive rounded-xl p-5">
      <p className="font-serif text-lg text-[var(--fg)]">Where would you land?</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Same scale as the gauge, it&apos;ll update as the range above does.
        {marker == null ? ' Score shows up after you run the scorer.' : ''}
      </p>

      <div className="mt-4">
        <svg viewBox="0 0 100 22" className="h-14 w-full" preserveAspectRatio="none" role="img" aria-label="Policy bands on credit score scale">
          <rect x={0} y={4} width={pDeny} height={10} rx={1.5} fill="#5c2a2a" opacity={0.95} />
          <rect x={pDeny} y={4} width={Math.max(0, pApprove - pDeny)} height={10} fill="#5c4a22" opacity={0.95} />
          <rect x={pApprove} y={4} width={100 - pApprove} height={10} rx={1.5} fill="#2d4a32" opacity={0.95} />
          {marker != null ? (
            <>
              <line x1={marker} x2={marker} y1={1} y2={17} stroke="var(--accent)" strokeWidth={1.4} strokeLinecap="round" />
              <circle cx={marker} cy={2.5} r={2} fill="var(--accent-soft)" />
            </>
          ) : null}
        </svg>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-[10px] tabular-nums text-[var(--faint)]">
          <span>300</span>
          <span className="text-[#c9a090]">deny &lt; {thresholds.deny}</span>
          <span className="text-[#d4c090]">in between</span>
          <span className="text-[#9dc49a]">{thresholds.approve}+</span>
          <span>850</span>
        </div>
        {marker != null && score != null ? (
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            {label ? (
              <>
                “{label}” → <strong className="font-mono text-[var(--accent-soft)]">{score}</strong>
              </>
            ) : (
              <>
                Last run → <strong className="font-mono text-[var(--accent-soft)]">{score}</strong>
              </>
            )}
          </p>
        ) : null}
      </div>
    </section>
  )
}
