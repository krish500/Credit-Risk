import { ReactNode } from 'react'

interface Props {
  label: string
  hint?: string
  children: ReactNode
}

export default function FormField({ label, hint, children }: Props) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--muted)]">
        {label}
        {hint ? <span className="font-normal text-[var(--faint)]">{hint}</span> : null}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  )
}
