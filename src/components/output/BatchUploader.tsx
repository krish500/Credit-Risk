'use client'

import { ChangeEvent, useState } from 'react'
import { Download, Upload } from 'lucide-react'

import { batchPredict } from '@/lib/api'
import { BatchPredictionResult, Thresholds } from '@/lib/types'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Props {
  thresholds: Thresholds
}

export default function BatchUploader({ thresholds }: Props) {
  const [rows, setRows] = useState<BatchPredictionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maxRows, setMaxRows] = useState(400)
  const [maxRowsDraft, setMaxRowsDraft] = useState<string | null>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      setRows(await batchPredict(file, thresholds, maxRows))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Batch scoring failed')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  function downloadCsv() {
    const header = ['row_id', 'probability', 'score', 'decision']
    const lines = rows.map((row) => [row.row_id, row.probability, row.score, row.decision].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'credit-risk-results.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleMaxRowsChange(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value
    setMaxRowsDraft(rawValue)
    if (rawValue === '') return

    const nextValue = Number(rawValue)
    if (Number.isFinite(nextValue)) {
      setMaxRows(nextValue)
    }
  }

  return (
    <section className="surface surface-interactive rounded-xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-lg text-[var(--fg)]">Batch mode</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            You can upload a csv to score the rows in bulk (it doesn&apos;t train the model, but helps not overloading the backend).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
              Max rows
              <input
                type="number"
                min={1}
                max={5000}
                value={maxRowsDraft ?? String(maxRows)}
                onChange={handleMaxRowsChange}
                onBlur={() => setMaxRowsDraft(null)}
                className="focus-ring w-20 rounded-md border border-[var(--border)] bg-[var(--page-2)] px-2 py-1 font-mono text-[var(--fg)]"
              />
            </label>
          </div>
        </div>
        <label className="focus-ring inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--page)] px-3 text-xs font-medium text-[var(--fg)]">
          {loading ? <LoadingSpinner /> : <Upload size={14} />}
          Upload CSV
          <input className="sr-only" type="file" accept=".csv" onChange={handleFile} />
        </label>
      </div>
      {error ? <p className="mt-2 text-sm text-[#e8a090]">{error}</p> : null}
      {rows.length > 0 ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <p className="text-[var(--muted)]">{rows.length} rows scored</p>
            <button
              type="button"
              className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2 text-xs text-[var(--fg)]"
              onClick={downloadCsv}
            >
              <Download size={13} />
              Download CSV
            </button>
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--border)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--page)] text-[var(--faint)]">
                <tr>
                  <th className="px-2 py-1.5">Row / ID</th>
                  <th className="px-2 py-1.5">P(default)</th>
                  <th className="px-2 py-1.5">Score</th>
                  <th className="px-2 py-1.5">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row) => (
                  <tr key={`${row.row_id}-${row.score}`} className="border-t border-[var(--border)] text-[var(--muted)]">
                    <td className="px-2 py-1.5 font-mono">{row.row_id}</td>
                    <td className="px-2 py-1.5">{(row.probability * 100).toFixed(1)}%</td>
                    <td className="px-2 py-1.5">{row.score}</td>
                    <td className="px-2 py-1.5 capitalize">{row.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}
