export const BASE_URL: string

export type PredictRiskInput = {
  cycle_length: number
  stress_level: number
  sleep_hours: number
  mood_score: number
  symptom_count: number
  user_id?: string
}

export type PredictRiskResponse = {
  risk: 'Low' | 'Medium' | 'High'
  explanation: string[]
}

export type CombinedIntelligenceInput = {
  digital_twin_deviation_score: number
  ml_risk_level: string
  high_deviation_threshold?: number
  mild_deviation_threshold?: number
  user_id?: string
}

export type CombinedIntelligenceResponse = {
  final_risk: 'Low' | 'Medium' | 'High'
  final_ai_insight: string
}

export function predictRisk(data: PredictRiskInput): Promise<PredictRiskResponse>
export function getCombinedIntelligence(
  data: CombinedIntelligenceInput,
): Promise<CombinedIntelligenceResponse>
export function checkHealth(): Promise<{ ok: boolean }>

export type HealthDataEntry = {
  user_id: string
  timestamp: number
  daily: { mood: number; sleep_hours: number; stress_level: number }
  weekly: {
    weight: number
    exercise_minutes: number
    symptoms: { acne: boolean; hairfall: boolean; fatigue: boolean }
  }
  monthly: {
    cycle_start_date: string
    cycle_end_date: string
    pain_level: number
    regularity: boolean
  }
}

export function addHealthData(data: HealthDataEntry): Promise<{ ok: boolean }>

