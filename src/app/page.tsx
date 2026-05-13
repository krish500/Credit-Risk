'use client'

import { useCallback, useEffect, useState } from 'react'

import PolicyBandsChart from '@/components/charts/PolicyBandsChart'
import Header from '@/components/layout/Header'
import ApplicationForm from '@/components/input/ApplicationForm'
import ThresholdControls from '@/components/input/ThresholdControls'
import BatchUploader from '@/components/output/BatchUploader'
import ModelCard from '@/components/output/ModelCard'
import ResultPanel, { ResultDetailsPanel } from '@/components/output/ResultPanel'
import { predict } from '@/lib/api'
import { LoanApplication, PredictionResult, Thresholds } from '@/lib/types'

const STORAGE_LABEL = 'credit-risk-engine-borrower-label'
type ActiveTab = 'demo' | 'about'

function StepLabel({ number }: { number: number }) {
  return (
    <div className="mb-2 flex items-center">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-warm)] bg-[var(--card-2)] font-mono text-[var(--accent-soft)]">
        {number}
      </span>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('demo')
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [thresholds, setThresholds] = useState<Thresholds>({ approve: 700, deny: 580 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [borrowerLabel, setBorrowerLabel] = useState('')
  const [runVersion, setRunVersion] = useState(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LABEL)
      if (saved) setBorrowerLabel(saved)
    } catch {
      /* ignore */
    }
  }, [])

  const persistBorrowerLabel = useCallback((value: string) => {
    setBorrowerLabel(value)
    try {
      if (value.trim()) localStorage.setItem(STORAGE_LABEL, value)
      else localStorage.removeItem(STORAGE_LABEL)
    } catch {
      /* ignore */
    }
  }, [])

  async function handleSubmit(application: LoanApplication) {
    setLoading(true)
    setError(null)
    try {
      setResult(await predict(application, thresholds))
      setRunVersion((v) => v + 1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pb-12">
      <Header />
      <div className="mx-auto max-w-lg px-4 pt-6 lg:max-w-4xl">
        <div className="grid grid-cols-2 rounded-md border border-[var(--border)] bg-[var(--card-2)] p-1">
          {(['demo', 'about'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`focus-ring rounded px-3 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'bg-[var(--accent)] text-[#1b120d]'
                  : 'text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--fg)]'
              }`}
              aria-pressed={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'demo' ? (
        <div className="mx-auto grid max-w-lg grid-cols-1 gap-5 px-4 pt-5 lg:max-w-6xl lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div>
                <StepLabel number={1} />
                <ThresholdControls thresholds={thresholds} onChange={setThresholds} />
              </div>

              <div>
                <StepLabel number={2} />
                <PolicyBandsChart thresholds={thresholds} score={result?.score ?? null} borrowerLabel={borrowerLabel} />
              </div>
            </div>

            <div>
              <StepLabel number={3} />
              <ApplicationForm
                onSubmit={handleSubmit}
                loading={loading}
                borrowerLabel={borrowerLabel}
                onBorrowerLabelChange={persistBorrowerLabel}
              />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <StepLabel number={4} />
              <ResultPanel
                result={result}
                loading={loading}
                error={error}
                borrowerLabel={borrowerLabel}
                runVersion={runVersion}
              />
            </div>
            <ResultDetailsPanel result={result} />
            <BatchUploader thresholds={thresholds} />
            <ModelCard />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-5">
          <section className="surface rounded-md p-5">
            <p className="font-serif text-2xl font-semibold leading-tight text-[var(--fg)]">About this demo</p>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
              <p>
                This is a small credit risk demo that estimates whether a borrower should be approved or
                denied for a loan. It uses a small sample of loan application data from Kaggle, a trained XGBoost model, and SHAP
                explanations so the score isn&apos;t just a black box.
              </p>
              <p>
                I got the idea from Business 2257. In the final exam, we would eventually find out whether a company
                should take a bank loan or raise equity. Ironically, I didn&apos;t get to that part of the exam, but I
                always wondered when a bank would reject or accept a borrower and how they decide this quantitatively.
              </p>
              <p>
                So I built this as a practical version of that question. The data comes from Home Credit Default Risk, a
                past Kaggle competition from 2018, and the interface turns the model into an interactive UI, so you can play around with it.
                I used AI to help speed up parts of the interface, but I built the backend and model pipeline myself.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
