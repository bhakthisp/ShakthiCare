export type MlRiskLevel = 'Low' | 'Medium' | 'High'

export type CombinedIntelligenceResult = {
  finalRisk: MlRiskLevel
  finalAiInsight: string
}

/** Matches `pcod_risk_engine.ShaktiCarePCODRiskModel` rule tiers. */
export type MlFeatureRow = {
  cycle_length: number
  stress_level: number
  sleep_hours: number
  mood_score: number
  symptom_count: number
}

export type ShaktiAlertLevel = 'high' | 'medium' | 'normal'

export type ShaktiAlertItem = {
  level: ShaktiAlertLevel
  title: string
  detail?: string
}

export type IntelligenceThresholds = {
  /** Strictly above → High when fusing with Digital Twin. */
  highDeviation: number
  /** Above this and at most ``highDeviation`` → mild deviation (Medium path). */
  mildDeviation: number
}

const DEFAULT_THRESHOLDS: IntelligenceThresholds = {
  highDeviation: 5,
  mildDeviation: 2,
}

/** Rule-based ML risk (same thresholds as backend `ShaktiCarePCODRiskModel`). */
export function predictMlRiskFromFeatures(row: MlFeatureRow): MlRiskLevel {
  const highCycle = 35
  const highStress = 4
  const mediumCycle = 30
  const lowSleep = 5

  if (row.cycle_length > highCycle && row.stress_level > highStress) {
    return 'High'
  }
  if (row.cycle_length > mediumCycle || row.sleep_hours < lowSleep) {
    return 'Medium'
  }
  return 'Low'
}

/** Digital Twin baseline (see `DigitalTwinPage.tsx`). */
export const TWIN_BASELINE_CYCLE = 28
export const TWIN_BASELINE_MOOD = 4

/**
 * Twin deviation signals aligned with Digital Twin cards (cycle + stress + mood),
 * separate from the scalar score passed into `combineDigitalTwinAndMl`.
 */
export function computeTwinSignals(
  currentCycle: number,
  stress: number,
  mood: number,
): {
  cycleDeviationScore: number
  twinHigh: boolean
  twinMild: boolean
  twinNormal: boolean
  twinDeviation: boolean
} {
  const cycleDeviationScore = currentCycle - TWIN_BASELINE_CYCLE
  const moodDev = mood - TWIN_BASELINE_MOOD
  const twinHigh = cycleDeviationScore > 5 || stress >= 4
  const twinMild =
    !twinHigh && (cycleDeviationScore > 2 || Math.abs(moodDev) >= 1)
  const twinNormal = !twinHigh && !twinMild
  return {
    cycleDeviationScore,
    twinHigh,
    twinMild,
    twinNormal,
    twinDeviation: !twinNormal,
  }
}

function normalizeMlRisk(mlRiskLevel: string): MlRiskLevel {
  const key = mlRiskLevel.trim().toLowerCase()
  if (key === 'high') return 'High'
  if (key === 'medium') return 'Medium'
  if (key === 'low') return 'Low'
  throw new Error(`Invalid mlRiskLevel: ${JSON.stringify(mlRiskLevel)}`)
}

/**
 * ShaktiCare AI intelligence core: fuse Digital Twin deviation score with ML risk level.
 */
export function combineDigitalTwinAndMl(
  digitalTwinDeviationScore: number,
  mlRiskLevel: string,
  thresholds: Partial<IntelligenceThresholds> = {},
): CombinedIntelligenceResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds }
  const ml = normalizeMlRisk(mlRiskLevel)

  const highTwin = digitalTwinDeviationScore > t.highDeviation
  const mildTwin =
    digitalTwinDeviationScore > t.mildDeviation &&
    digitalTwinDeviationScore <= t.highDeviation

  let finalRisk: MlRiskLevel
  if (ml === 'High' || highTwin) {
    finalRisk = 'High'
  } else if (ml === 'Medium' || mildTwin) {
    finalRisk = 'Medium'
  } else {
    finalRisk = 'Low'
  }

  const finalAiInsight =
    finalRisk === 'Low'
      ? 'Your health patterns are stable and within healthy ranges'
      : 'Multiple factors are combining to suggest potential reproductive health considerations'

  return { finalRisk, finalAiInsight }
}

const MSG_COMBINED_HIGH = 'High stress and irregular cycles are contributing to elevated PCOD risk patterns'
const MSG_ML_EARLY = 'Behavioral factors like stress and sleep are signaling early reproductive health concerns'
const MSG_TWIN_LIFESTYLE = 'Lifestyle patterns are impacting hormonal balance and cycle regularity'

/**
 * Dashboard / ShaktiCare AI alerts: Digital Twin + ML together (copy + severity).
 */
export function buildShaktiCareCombinedAlerts(
  row: MlFeatureRow,
  thresholds: Partial<IntelligenceThresholds> = {},
): ShaktiAlertItem[] {
  const ml = predictMlRiskFromFeatures(row)
  const twin = computeTwinSignals(row.cycle_length, row.stress_level, row.mood_score)
  const fused = combineDigitalTwinAndMl(twin.cycleDeviationScore, ml, thresholds)

  const twinSummary = twin.twinDeviation
    ? twin.twinHigh
      ? 'Digital Twin: elevated deviation from baseline (cycle or stress).'
      : 'Digital Twin: mild shift from baseline (cycle or mood).'
    : 'Digital Twin: within normal baseline range.'

  const mlSummary =
    ml === 'High'
      ? 'ML: high behavioral / cycle risk band.'
      : ml === 'Medium'
        ? 'ML: moderate risk markers.'
        : 'ML: low risk band.'

  // 1) ML high while twin looks normal — behavioral early signal
  if (ml === 'High' && twin.twinNormal) {
    return [
      {
        level: 'high',
        title: MSG_ML_EARLY,
        detail: `${mlSummary} ${twinSummary}`,
      },
    ]
  }

  // 2) Twin deviation while ML is low — lifestyle / baseline shift
  if (ml === 'Low' && twin.twinDeviation) {
    const level: ShaktiAlertLevel =
      fused.finalRisk === 'High'
        ? 'high'
        : fused.finalRisk === 'Medium'
          ? 'medium'
          : 'medium'
    return [
      {
        level,
        title: MSG_TWIN_LIFESTYLE,
        detail: `${twinSummary} ${mlSummary} Combined assessment: ${fused.finalRisk}.`,
      },
    ]
  }

  // 3) General combined high (twin and/or ML per fusion)
  if (fused.finalRisk === 'High') {
    return [
      {
        level: 'high',
        title: MSG_COMBINED_HIGH,
        detail: `${twinSummary} ${mlSummary}`,
      },
    ]
  }

  if (fused.finalRisk === 'Medium') {
    return [
      {
        level: 'medium',
        title: 'Cycle irregularity combined with behavioral factors indicates moderate health trends',
        detail: `${twinSummary} ${mlSummary}`,
      },
    ]
  }

  return [
    {
      level: 'normal',
      title: 'Health patterns are within normal ranges',
      detail: `${twinSummary} ${mlSummary}`,
    },
  ]
}
