import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserCycleTrend } from '../data/monthlyCycleData'
import { getCombinedIntelligence, predictRisk } from '../api.js'
import { getCurrentUser } from '../auth'

type CurrentUser = { name?: string; email: string }

function getDisplayName(user: CurrentUser) {
  if (user.name && user.name.trim()) return user.name.trim()
  const prefix = user.email.split('@')[0] ?? 'User'
  return prefix
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const demoUsers = [
  { email: 'asha@gmail.com' },
  { email: 'neha@gmail.com' },
  { email: 'kavya@gmail.com' },
  { email: 'pooja@gmail.com' },
  { email: 'riya@gmail.com' },
]

function userDataKey(email: string) {
  return `userData_${email.trim().toLowerCase()}`
}

function isDemoUser(email: string) {
  return demoUsers.some((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase())
}

function cycleLengthFromDates(start: string, end: string): number | null {
  if (!start || !end) return null
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return null
  const days = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1
  if (days <= 0 || days > 80) return null
  return days
}

type Level = 'normal' | 'mild' | 'high'

function levelStyles(level: Level) {
  if (level === 'high') return 'ring-rose-200/70 bg-rose-100/70 text-rose-900'
  if (level === 'mild') return 'ring-amber-200/70 bg-amber-100/70 text-amber-900'
  return 'ring-emerald-200/70 bg-emerald-100/70 text-emerald-900'
}

function TwinCard({
  title,
  value,
  level,
  hint,
}: {
  title: string
  value: string
  level: Level
  hint?: string
}) {
  return (
    <div className="glass-card p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-pink-50/50 to-purple-50/50">
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-800 transition-all duration-500">{value}</div>
      <div className="mt-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 transition-all duration-300 hover:scale-105 ${
            level === 'high' ? 'ring-red-300 bg-red-50 text-red-800' :
            level === 'mild' ? 'ring-yellow-300 bg-yellow-50 text-yellow-800' :
            'ring-green-300 bg-green-50 text-green-800'
          }`}
        >
          {level === 'high' ? '🔴 High' : level === 'mild' ? '🟡 Mild' : '🟢 Normal'}
        </span>
      </div>
      {hint ? <div className="mt-2 text-xs text-gray-600">{hint}</div> : null}
    </div>
  )
}

function CompareLineChart({
  baseline,
  current,
  labels,
}: {
  baseline: number[]
  current: number[]
  labels: string[]
}) {
  const width = 560
  const height = 190
  const padX = 18
  const padY = 18

  const all = [...baseline, ...current].filter((n) => n > 0)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = Math.max(1, max - min)

  const mkPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padX + (i * (width - padX * 2)) / Math.max(1, values.length - 1)
        const y = padY + ((max - v) * (height - padY * 2)) / range
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

  const basePts = mkPoints(baseline)
  const curPts = mkPoints(current)

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/30 bg-white/30 p-3 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 px-1 pb-2 text-xs font-semibold text-gray-700">
        <span>Normal vs Current</span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Baseline
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
            Current
          </span>
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img">
        <g opacity="0.2">
          {Array.from({ length: 4 }).map((_, idx) => {
            const y = padY + (idx * (height - padY * 2)) / 3
            return (
              <line
                key={idx}
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#111827"
                strokeWidth="1"
              />
            )
          })}
        </g>

        <polyline
          points={basePts}
          fill="none"
          stroke="#10b981"
          strokeOpacity="0.95"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={curPts}
          fill="none"
          stroke="#d946ef"
          strokeOpacity="0.95"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="mt-2 flex justify-between text-[11px] font-medium text-gray-600">
        {labels.map((l) => (
          <span key={l} className="px-1">
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

export function DigitalTwinPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiCombined, setApiCombined] = useState<{ final_risk: string; final_ai_insight: string } | null>(null)

  useEffect(() => {
    try {
      const parsed = getCurrentUser()
      if (!parsed) {
        navigate('/login', { replace: true })
        return
      }
      setUser(parsed as unknown as CurrentUser)
    } catch {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const displayName = useMemo(() => (user ? getDisplayName(user) : 'User'), [user])

  const localEntries = useMemo(() => {
    if (!user) return [] as Array<Record<string, unknown>>
    try {
      const raw = localStorage.getItem(userDataKey(user.email))
      const parsed = JSON.parse(raw ?? '[]') as unknown
      return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === 'object') as Array<Record<string, unknown>> : []
    } catch {
      return []
    }
  }, [user])

  const isCurrentUserDemo = useMemo(
    () => (user ? isDemoUser(user.email) : false),
    [user],
  )

  const localCycleTrend = useMemo(() => {
    const lengths = localEntries
      .map((entry) =>
        cycleLengthFromDates(
          String((entry as any).monthly?.cycle_start_date),
          String((entry as any).monthly?.cycle_end_date),
        ),
      )
      .filter((length): length is number => typeof length === 'number')
    return lengths.slice(-3)
  }, [localEntries])

  const noDataForNewUser = user && !isCurrentUserDemo && localEntries.length === 0

  // Baseline (historical average)
  const baseline = useMemo(() => {
    if (isCurrentUserDemo) {
      // Demo users: use static baseline
      return {
        avgCycle: 28,
        avgMood: 4,
        avgSleep: 7.0,
        avgStress: 2,
        avgSymptomsFreq: 'Low',
        cycleTrend: [27, 28, 29],
      }
    } else if (localEntries.length > 0) {
      // New users with data: calculate from userData
      const cycleLengths = localEntries
        .map((entry) =>
          cycleLengthFromDates(
            String((entry as any).monthly?.cycle_start_date),
            String((entry as any).monthly?.cycle_end_date),
          ),
        )
        .filter((length): length is number => typeof length === 'number')

      const avgCycle = cycleLengths.length > 0 ? cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length : 28

      const moods = localEntries.map((entry) => Number((entry as any).daily?.mood)).filter((m) => !isNaN(m))
      const avgMood = moods.length > 0 ? moods.reduce((sum, m) => sum + m, 0) / moods.length : 4

      const sleeps = localEntries.map((entry) => Number((entry as any).daily?.sleep_hours)).filter((s) => !isNaN(s))
      const avgSleep = sleeps.length > 0 ? sleeps.reduce((sum, s) => sum + s, 0) / sleeps.length : 7.0

      const stresses = localEntries.map((entry) => Number((entry as any).daily?.stress_level)).filter((s) => !isNaN(s))
      const avgStress = stresses.length > 0 ? stresses.reduce((sum, s) => sum + s, 0) / stresses.length : 2

      const symptomCounts = localEntries.map((entry) => {
        const sym = (entry as any).weekly?.symptoms
        return [sym?.acne, sym?.hairfall, sym?.fatigue].filter(Boolean).length
      })
      const avgSymptomCount = symptomCounts.length > 0 ? symptomCounts.reduce((sum, c) => sum + c, 0) / symptomCounts.length : 0
      const avgSymptomsFreq = avgSymptomCount < 1 ? 'Low' : avgSymptomCount < 2 ? 'Medium' : 'High'

      return {
        avgCycle,
        avgMood,
        avgSleep,
        avgStress,
        avgSymptomsFreq,
        cycleTrend: cycleLengths.slice(-3),
      }
    } else {
      // Fallback, though not used for new users without data
      return {
        avgCycle: 28,
        avgMood: 4,
        avgSleep: 7.0,
        avgStress: 2,
        avgSymptomsFreq: 'Low',
        cycleTrend: [27, 28, 29],
      }
    }
  }, [isCurrentUserDemo, localEntries])

  // Current state
  const current = useMemo(() => {
    const name = user?.name?.trim() ? user.name.trim() : user ? getDisplayName(user) : 'User'
    const trend = localCycleTrend.length
      ? localCycleTrend
      : isCurrentUserDemo
      ? getUserCycleTrend(name).values.slice(-3)
      : []
    const cycleTrend = trend.length ? trend : []
    const currentCycle = cycleTrend.at(-1) ?? 0

    const latestEntry = localEntries.at(-1)
    const mood = latestEntry ? Number((latestEntry as any).daily?.mood) || 3 : 3
    const sleep = latestEntry ? Number((latestEntry as any).daily?.sleep_hours) || 4.8 : 4.8
    const stress = latestEntry ? Number((latestEntry as any).daily?.stress_level) || 5 : 5

    const symptoms = (latestEntry as any)?.weekly?.symptoms ?? { acne: true, fatigue: true, hair_fall: false }

    return {
      cycleTrend,
      currentCycle,
      mood,
      sleep,
      stress,
      symptoms: {
        acne: Boolean((symptoms as any).acne),
        fatigue: Boolean((symptoms as any).fatigue),
        hair_fall: Boolean((symptoms as any).hair_fall ?? (symptoms as any).hairfall),
      },
    }
  }, [user, localCycleTrend, localEntries, isCurrentUserDemo])

  const cycleDeviation = current.currentCycle - baseline.avgCycle
  const moodDeviation = current.mood - baseline.avgMood

  const insight = useMemo(() => {
    const insights: string[] = []

    if (cycleDeviation !== 0) insights.push('Deviation detected in cycle consistency')
    if (current.stress >= 4 && current.sleep < 5) {
      insights.push('Behavioral imbalance affecting hormonal cycle detected')
    }
    if (cycleDeviation > 5 || current.stress >= 4) {
      insights.push('High risk pattern deviation observed')
    }

    if (insights.length === 0) return 'Baseline matched — stable pattern detected'
    return insights[0]!
  }, [cycleDeviation, current.sleep, current.stress])

  const insightTag: Level = useMemo(() => {
    if (cycleDeviation > 5 || (current.stress >= 4 && current.sleep < 5)) return 'high'
    if (cycleDeviation > 2) return 'mild'
    return 'normal'
  }, [cycleDeviation, current.sleep, current.stress])

  // Digital twin deviation computed in frontend, then fused via backend API.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setApiError(null)
      try {
        const features = {
          cycle_length: current.currentCycle,
          stress_level: current.stress,
          sleep_hours: current.sleep,
          mood_score: current.mood,
          symptom_count: Object.values(current.symptoms).filter(Boolean).length,
        }
        const p = await predictRisk(features)
        if (cancelled) return
        const c = await getCombinedIntelligence({
          digital_twin_deviation_score: cycleDeviation,
          ml_risk_level: p.risk,
        })
        if (cancelled) return
        setApiCombined(c)
      } catch (e) {
        if (cancelled) return
        setApiError('Unable to refresh right now.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, current, cycleDeviation])

  const labels = ['Jan', 'Feb', 'Mar']

  if (noDataForNewUser) {
    return (
      <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 backdrop-blur-md transition-all duration-300">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
            Digital Twin
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
            Compare <span className="font-semibold text-gray-800">{displayName}</span>’s healthy baseline vs current real-time state — and surface deviations with AI insights.
          </p>
        </div>
        <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-blue-50/50">
          <div className="text-sm font-semibold text-gray-800">No data available</div>
          <div className="mt-2 text-sm text-gray-700">
            No data available. Please enter your health data to generate your Digital Twin.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
          Digital Twin
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
          Compare <span className="font-semibold text-gray-800">{displayName}</span>’s healthy baseline vs current real-time state — and surface deviations with AI insights.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-purple-50/50 relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl opacity-50 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                AI Insight
              </div>
              <div className="mt-1 text-lg font-bold text-gray-800 transition-all duration-500">
                {apiCombined?.final_ai_insight ?? insight}
              </div>
              <div className="mt-1 text-sm text-gray-700">
                cycleDeviation: <span className="font-semibold text-gray-800 transition-all duration-300">{cycleDeviation}</span> days, moodDeviation:{' '}
                <span className="font-semibold text-gray-800 transition-all duration-300">{moodDeviation}</span>
              </div>
              {apiError ? (
                <div className="mt-2 text-xs font-semibold text-rose-900">
                  We couldn’t refresh insights right now.
                </div>
              ) : null}
            </div>

            <span
              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ring-1 transition-all duration-300 ${levelStyles(insightTag)}`}
            >
              {insightTag === 'high' ? '🔴 High deviation alert' : insightTag === 'mild' ? '🟡 Minor variation detected' : '🟢 Stable'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="rounded-2xl border border-white/30 bg-white/35 p-4 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-purple-50/50">
                <div className="text-sm font-semibold text-gray-700">
                  Normal Pattern (Digital Twin Baseline)
                </div>
                <div className="text-xs font-medium text-gray-600">
                  Your Healthy Baseline Pattern
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TwinCard
                  title="Average Cycle Length"
                  value={`${baseline.avgCycle} days`}
                  level="normal"
                  hint="Historical average baseline"
                />
                <TwinCard
                  title="Average Mood Score"
                  value={`${baseline.avgMood} / 5`}
                  level="normal"
                />
                <TwinCard
                  title="Average Sleep Hours"
                  value={`${baseline.avgSleep.toFixed(1)} hrs`}
                  level="normal"
                />
                <TwinCard
                  title="Average Stress Level"
                  value={`${baseline.avgStress} / 5`}
                  level="normal"
                />
                <TwinCard
                  title="Average Symptoms Frequency"
                  value={baseline.avgSymptomsFreq}
                  level="normal"
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-white/30 bg-white/35 p-4 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                <div className="text-sm font-semibold text-gray-700">
                  Current Pattern (Real-time Data)
                </div>
                <div className="text-xs font-medium text-gray-600">Current Health State</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TwinCard
                  title="Current Cycle Length"
                  value={`${current.currentCycle} days`}
                  level={cycleDeviation > 5 ? 'high' : cycleDeviation > 2 ? 'mild' : 'normal'}
                />
                <TwinCard
                  title="Current Mood Score"
                  value={`${current.mood} / 5`}
                  level={Math.abs(moodDeviation) >= 2 ? 'high' : Math.abs(moodDeviation) >= 1 ? 'mild' : 'normal'}
                />
                <TwinCard
                  title="Current Sleep Hours"
                  value={`${current.sleep.toFixed(1)} hrs`}
                  level={current.sleep < 5 ? 'high' : current.sleep < 6 ? 'mild' : 'normal'}
                />
                <TwinCard
                  title="Current Stress Level"
                  value={`${current.stress} / 5`}
                  level={current.stress >= 4 ? 'high' : current.stress >= 3 ? 'mild' : 'normal'}
                />
                <div className="glass-card p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-pink-50/50 to-purple-50/50 sm:col-span-2">
                  <div className="text-sm font-semibold text-gray-700">Current Symptoms</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['acne', 'fatigue', 'hair_fall'] as const).map((k) => {
                      const on = current.symptoms[k]
                      return (
                        <span
                          key={k}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                            on
                              ? 'bg-amber-100/70 text-amber-900 ring-amber-200/70'
                              : 'bg-emerald-100/70 text-emerald-900 ring-emerald-200/70'
                          }`}
                        >
                          {k === 'hair_fall' ? 'hair fall' : k} {on ? '• yes' : '• no'}
                        </span>
                      )
                    })}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Color-coding shows deviation likelihood from baseline.
                  </div>
                </div>
              </div>
            </section>
          </div>

      <div className="mt-8">
            <div className="text-sm font-semibold text-gray-700">
              Normal vs Current Cycle Trend
            </div>
            <CompareLineChart
              baseline={baseline.cycleTrend}
              current={current.cycleTrend}
              labels={labels.slice(-baseline.cycleTrend.length)}
            />
      </div>

      <div className="mt-6 text-xs text-gray-700">
            <span className="font-semibold text-gray-800">Demo line for judges:</span> Our system doesn’t just detect issues, it correlates lifestyle and biological patterns.
      </div>
    </div>
  )
}

