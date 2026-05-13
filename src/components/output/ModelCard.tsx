'use client'

import { useEffect, useState } from 'react'

import { fetchModelInfo } from '@/lib/api'
import type { ModelInfo } from '@/lib/types'

export default function ModelCard() {
  const [info, setInfo] = useState<ModelInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchModelInfo()
        if (!cancelled) setInfo(data)
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not load model info')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <section className="surface rounded-xl p-5">
        <p className="font-serif text-base text-[var(--fg)]">Behind the scenes</p>
        <p className="mt-2 text-sm text-[#e8a090]">{error}</p>
      </section>
    )
  }

  if (!info) {
    return (
      <section className="surface rounded-xl p-5">
        <p className="text-sm text-[var(--muted)]">Pulling training notes…</p>
      </section>
    )
  }

  const metrics = info.metrics
  const globalFeatures = info.global_importance?.features?.slice(0, 5) ?? []
  const hasLiveMetrics = Boolean(metrics?.auc_roc != null && metrics?.gini != null)

  return (
    <section className="surface surface-interactive rounded-xl p-5">
      <p className="font-serif text-lg text-[var(--fg)]">What I actually trained</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Tried not to hard code: the numbers come from <code className="rounded bg-[var(--page-2)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-soft)]">train.py</code> when you have data. Utilization is a proxy, so read that signal carefully.
      </p>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2 border-t border-[var(--border)] pt-3">
          <dt className="text-[var(--faint)]">Mode</dt>
          <dd className="text-right text-[var(--fg)]">{info.mode === 'trained_model' ? 'XGBoost + SHAP' : 'Heuristic fallback'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--faint)]">Holdout AUC / Gini</dt>
          <dd className="text-right font-mono text-[var(--fg)]">
            {hasLiveMetrics ? (
              <>
                {metrics?.auc_roc} / {metrics?.gini}
              </>
            ) : (
              <span className="font-sans text-[var(--muted)]">train first</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--faint)]">Data</dt>
          <dd className="max-w-[14rem] text-right text-xs text-[var(--muted)]">{metrics?.dataset ?? 'Drop application_train.csv in backend/data'}</dd>
        </div>
      </dl>

      {metrics?.data_limitations?.length ? (
        <ul className="mt-3 list-inside list-disc space-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--faint)]">
          {metrics.data_limitations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {globalFeatures.length > 0 ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--faint)]">Which columns the model leans on globally (|SHAP| on {info.global_importance?.sample_rows} rows)</p>
          <div className="mt-3 space-y-2.5">
            {globalFeatures.map((feature) => (
              <div key={feature.name}>
                <div className="mb-0.5 flex justify-between text-xs">
                  <span className="truncate text-[var(--muted)]">{feature.label}</span>
                  <span className="shrink-0 tabular-nums text-[var(--fg)]">{feature.importance}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--track)]">
                  <div className="h-1.5 rounded-full bg-[var(--accent-dim)]" style={{ width: `${feature.importance}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
