import { BatchPredictionResult, LoanApplication, ModelInfo, PredictionResult, Thresholds } from './types'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001').replace(/\/+$/, '')

export async function fetchModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${API_URL}/model-info`, { cache: 'no-store' })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Model info failed' }))
    throw new Error(error.detail || 'Model info failed')
  }
  return response.json()
}

export async function predict(application: LoanApplication, thresholds: Thresholds): Promise<PredictionResult> {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application, thresholds }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Prediction failed' }))
    throw new Error(error.detail || 'Prediction failed')
  }

  return response.json()
}

export async function batchPredict(file: File, thresholds: Thresholds, maxRows = 500): Promise<BatchPredictionResult[]> {
  const form = new FormData()
  form.append('file', file)
  const query = new URLSearchParams({
    approve: String(thresholds.approve),
    deny: String(thresholds.deny),
    max_rows: String(Math.min(5000, Math.max(1, maxRows))),
  })
  const response = await fetch(`${API_URL}/batch?${query}`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Batch scoring failed' }))
    throw new Error(error.detail || 'Batch scoring failed')
  }

  return response.json()
}
