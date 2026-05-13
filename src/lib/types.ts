export type Decision = 'approve' | 'review' | 'deny'

export interface LoanApplication {
  age: number
  income: number
  employment_years: number
  education: 'secondary' | 'higher' | 'incomplete_higher'
  loan_amount: number
  loan_term: 12 | 24 | 36 | 48 | 60
  loan_purpose: 'consumer' | 'auto' | 'home' | 'education'
  credit_history_years: number
  existing_loans: number
  previous_defaults: number
  credit_utilization: number
  debt_to_income: number
}

export interface Thresholds {
  approve: number
  deny: number
}

export interface ShapFactor {
  feature: string
  value: number
  shap_value: number
  direction: 'increases_risk' | 'decreases_risk'
  plain_english: string
}

export interface PredictionResult {
  probability: number
  score: number
  decision: Decision
  decision_reason: string
  top_factors: ShapFactor[]
  shap_base_value: number
  all_shap_values: number[]
  all_feature_names: string[]
}

export interface BatchPredictionResult extends PredictionResult {
  row_id: number
}

export interface ModelMetrics {
  trained_at?: string
  dataset?: string
  n_train?: number
  n_test?: number
  auc_roc?: number
  gini?: number
  data_limitations?: string[]
}

export interface GlobalImportanceFeature {
  name: string
  label: string
  importance: number
}

export interface GlobalImportancePayload {
  method: string
  sample_rows: number
  features: GlobalImportanceFeature[]
}

export interface ModelInfo {
  mode: 'trained_model' | 'heuristic_fallback'
  metrics: ModelMetrics | null
  global_importance: GlobalImportancePayload | null
}
