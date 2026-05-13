'use client'

import { ChangeEvent, FormEvent, useState } from 'react'

import { LoanApplication } from '@/lib/types'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import FormField from './FormField'
import { SCENARIOS } from './scenarios'

interface Props {
  onSubmit: (application: LoanApplication) => void
  loading: boolean
  borrowerLabel: string
  onBorrowerLabelChange: (value: string) => void
}

type NumericApplicationKey = {
  [K in keyof LoanApplication]: LoanApplication[K] extends number ? K : never
}[keyof LoanApplication]

const inputClass =
  'focus-ring h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--page-2)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--faint)]'

export default function ApplicationForm({ onSubmit, loading, borrowerLabel, onBorrowerLabelChange }: Props) {
  const [application, setApplication] = useState<LoanApplication>(SCENARIOS[0].data)
  const [presetIndex, setPresetIndex] = useState(0)
  const [numberDrafts, setNumberDrafts] = useState<Partial<Record<NumericApplicationKey, string>>>({})

  function update<K extends keyof LoanApplication>(key: K, value: LoanApplication[K]) {
    setPresetIndex(-1)
    setApplication((current) => ({ ...current, [key]: value }))
  }

  function updateNumber(key: NumericApplicationKey, event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value
    setPresetIndex(-1)
    setNumberDrafts((current) => ({ ...current, [key]: rawValue }))

    if (rawValue === '' || rawValue === '-' || rawValue === '.' || rawValue === '-.') {
      return
    }

    const nextValue = Number(rawValue)
    if (Number.isFinite(nextValue)) {
      setApplication((current) => ({ ...current, [key]: nextValue }))
    }
  }

  function numberInputProps(key: NumericApplicationKey) {
    return {
      value: numberDrafts[key] ?? String(application[key]),
      onChange: (event: ChangeEvent<HTMLInputElement>) => updateNumber(key, event),
      onBlur: () => {
        setNumberDrafts((current) => {
          if (!(key in current)) return current
          const next = { ...current }
          delete next[key]
          return next
        })
      },
    }
  }

  function applyPreset(index: number) {
    setPresetIndex(index)
    setNumberDrafts({})
    setApplication(SCENARIOS[index].data)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(application)
  }

  return (
    <section className="surface surface-interactive rounded-xl p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-lg text-[var(--fg)]">Add Details of Your Application</h2>
        <p className="text-sm text-[var(--muted)]">Presets are to help you, change it to whatever you desire</p>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-[var(--muted)]">Name this run (also optional)</span>
        <input
          className={`${inputClass} mt-1.5`}
          value={borrowerLabel}
          onChange={(e) => onBorrowerLabelChange(e.target.value)}
          placeholder="e.g. “I'm going to YC (larp), so I need this”, “mom’s co-signing!!”"
          maxLength={80}
          autoComplete="off"
        />
      </label>

      <div className="mt-4">
        <p className="text-xs text-[var(--faint)]">Quick load</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCENARIOS.map((scenario, index) => {
            const active = presetIndex === index
            return (
              <button
                key={scenario.label}
                type="button"
                onClick={() => applyPreset(index)}
                className={`focus-ring rounded-full border px-3 py-1.5 text-left text-xs transition-colors ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--fg)]'
                    : 'border-[var(--border)] bg-[var(--page-2)] text-[var(--muted)] hover:border-[var(--border-warm)] hover:text-[var(--fg)]'
                }`}
              >
                <span className="font-medium">{scenario.label}</span>
              </button>
            )
          })}
          {presetIndex === -1 ? (
            <span className="self-center rounded-full border border-dashed border-[var(--border-warm)] px-3 py-1.5 text-xs text-[var(--faint)]">Custom mix</span>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Age">
            <input className={inputClass} type="number" min={18} max={80} {...numberInputProps('age')} />
          </FormField>
          <FormField label="Income" hint="USD">
            <input className={inputClass} type="number" min={1} {...numberInputProps('income')} />
          </FormField>
          <FormField label="Employed (yrs)">
            <input className={inputClass} type="number" min={0} max={60} {...numberInputProps('employment_years')} />
          </FormField>
          <FormField label="Education">
            <select className={inputClass} value={application.education} onChange={(e) => update('education', e.target.value as LoanApplication['education'])}>
              <option value="secondary">Secondary</option>
              <option value="higher">Higher</option>
              <option value="incomplete_higher">Incomplete higher</option>
            </select>
          </FormField>
          <FormField label="Loan" hint="USD">
            <input className={inputClass} type="number" min={1} {...numberInputProps('loan_amount')} />
          </FormField>
          <FormField label="Term">
            <select className={inputClass} value={application.loan_term} onChange={(e) => update('loan_term', Number(e.target.value) as never)}>
              {[12, 24, 36, 48, 60].map((term) => (
                <option key={term} value={term}>
                  {term} months
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Purpose">
            <select className={inputClass} value={application.loan_purpose} onChange={(e) => update('loan_purpose', e.target.value as LoanApplication['loan_purpose'])}>
              <option value="consumer">Consumer</option>
              <option value="auto">Auto</option>
              <option value="home">Home</option>
              <option value="education">Education</option>
            </select>
          </FormField>
          <FormField label="Active loans">
            <input className={inputClass} type="number" min={0} max={20} {...numberInputProps('existing_loans')} />
          </FormField>
          <FormField label="Credit history" hint="yrs">
            <input className={inputClass} type="number" min={0} max={60} {...numberInputProps('credit_history_years')} />
          </FormField>
          <FormField label="Past defaults">
            <input className={inputClass} type="number" min={0} max={10} {...numberInputProps('previous_defaults')} />
          </FormField>
          <FormField label="Utilization" hint="0-1">
            <input className={inputClass} type="number" min={0} max={1} step={0.01} {...numberInputProps('credit_utilization')} />
          </FormField>
          <FormField label="DTI" hint="0-1.5">
            <input className={inputClass} type="number" min={0} max={1.5} step={0.01} {...numberInputProps('debt_to_income')} />
          </FormField>
        </div>

        <div className="flex flex-col gap-1.5 pt-2">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="focus-ring h-11 flex-1 rounded-lg bg-[var(--accent-dim)] text-sm font-semibold text-[#1a0f0a] shadow-liftSm transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <LoadingSpinner /> Working…
                </span>
              ) : (
                'Run the scorer'
              )}
            </button>
            <button
              type="button"
              className="focus-ring h-11 rounded-lg border border-[var(--border)] px-4 text-sm text-[var(--muted)] transition-colors hover:border-[var(--border-warm)] hover:text-[var(--fg)]"
              onClick={() => {
                applyPreset(0)
              }}
              aria-label="Reset to first preset"
            >
              Reset
            </button>
          </div>
          <p className="text-center text-[10px] text-[var(--faint)]">
            Tip: <kbd className="rounded border border-[var(--border)] bg-[var(--page-2)] px-1 py-0.5 font-mono text-[10px]">Enter</kbd> in a field also
            submits the form
          </p>
        </div>
      </form>
    </section>
  )
}
