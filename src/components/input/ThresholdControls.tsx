'use client'

import * as Slider from '@radix-ui/react-slider'

import { Thresholds } from '@/lib/types'

interface Props {
  thresholds: Thresholds
  onChange: (thresholds: Thresholds) => void
}

export default function ThresholdControls({ thresholds, onChange }: Props) {
  const denyMax = Math.max(305, thresholds.approve - 15)

  function handleApprove(values: number[]) {
    const approve = values[0]
    let deny = thresholds.deny
    if (deny > approve - 15) {
      deny = approve - 15
    }
    onChange({ approve, deny })
  }

  function handleDeny(values: number[]) {
    onChange({ ...thresholds, deny: values[0] })
  }

  return (
    <section className="surface surface-interactive rounded-xl p-5">
      <h2 className="font-serif text-lg text-[var(--fg)]">How strict are we?</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Drag these and the strip below updates live. I defaulted to 700 / 580 because it felt reasonable on paper.</p>

      <div className="mt-5 space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-sm text-[var(--muted)]">
            <span>Auto-approve at</span>
            <span className="tabular-nums text-[var(--fg)]">{thresholds.approve}+</span>
          </div>
          <Slider.Root
            className="relative flex h-6 touch-none select-none items-center"
            value={[thresholds.approve]}
            min={620}
            max={820}
            step={5}
            onValueChange={handleApprove}
            aria-label="Approve threshold"
          >
            <Slider.Track className="relative h-2 grow rounded-full bg-[var(--track)]">
              <Slider.Range className="absolute h-full rounded-full bg-[var(--ok)]" />
            </Slider.Track>
            <Slider.Thumb className="focus-ring block h-5 w-5 cursor-grab rounded-full border-2 border-[var(--border-warm)] bg-[var(--card-2)] active:cursor-grabbing" />
          </Slider.Root>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm text-[var(--muted)]">
            <span>Hard deny under</span>
            <span className="tabular-nums text-[var(--fg)]">&lt; {thresholds.deny}</span>
          </div>
          <Slider.Root
            className="relative flex h-6 touch-none select-none items-center"
            value={[Math.min(thresholds.deny, denyMax)]}
            min={300}
            max={denyMax}
            step={5}
            onValueChange={handleDeny}
            aria-label="Deny threshold"
          >
            <Slider.Track className="relative h-2 grow rounded-full bg-[var(--track)]">
              <Slider.Range className="absolute h-full rounded-full bg-[var(--danger)]" />
            </Slider.Track>
            <Slider.Thumb className="focus-ring block h-5 w-5 cursor-grab rounded-full border-2 border-[var(--border-warm)] bg-[var(--card-2)] active:cursor-grabbing" />
          </Slider.Root>
        </div>
      </div>
    </section>
  )
}
