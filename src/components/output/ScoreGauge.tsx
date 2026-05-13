'use client'

import { useEffect, useRef, useState } from 'react'

import { scoreToColor, scoreToLabel } from '@/lib/utils'

export default function ScoreGauge({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(300)
  const fromRef = useRef(300)

  const min = 300
  const max = 850

  useEffect(() => {
    const from = fromRef.current
    const to = score
    if (from === to) {
      setDisplayed(to)
      return
    }

    let frame: number
    const start = performance.now()
    const duration = 520

    function easeOut(t: number) {
      return 1 - (1 - t) ** 2.2
    }

    function tick(now: number) {
      const elapsed = Math.min(1, (now - start) / duration)
      const v = Math.round(from + (to - from) * easeOut(elapsed))
      setDisplayed(v)
      if (elapsed < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const pct = Math.max(0, Math.min(1, (displayed - min) / (max - min)))
  const radius = 84
  const circumference = Math.PI * radius
  const offset = circumference * (1 - pct)
  const color = scoreToColor(score)

  return (
    <div className="flex flex-col items-center">
      <svg className="h-[130px] w-[220px]" viewBox="0 0 238 142" role="img" aria-label={`Credit score ${displayed}`}>
        <path d="M 25 118 A 94 94 0 0 1 213 118" fill="none" stroke="var(--track)" strokeLinecap="round" strokeWidth="14" />
        <path
          d="M 25 118 A 94 94 0 0 1 213 118"
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="14"
          style={{ transition: 'stroke-dashoffset 480ms ease, stroke 280ms ease' }}
        />
        <text x="119" y="96" textAnchor="middle" fontSize="36" fontWeight="700" fill={color} className="font-mono">
          {displayed}
        </text>
        <text x="119" y="120" textAnchor="middle" fontSize="12" fill="var(--muted)">
          {scoreToLabel(score)}
        </text>
        <text x="18" y="136" fontSize="10" fill="var(--faint)">
          300
        </text>
        <text x="198" y="136" fontSize="10" fill="var(--faint)">
          850
        </text>
      </svg>
    </div>
  )
}
