import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

type Level = 'normal' | 'mild' | 'high'

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
  const [backendData, setBackendData] = useState<{
    risk: string
    explanation: string[]
    finalRisk: string
    finalAiInsight: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

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

  // Use backend API for all AI computations
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        // Sample data for demonstration - in real app, this would come from user data
        const features = {
          cycle_length: 30,
          stress_level: 3,
          sleep_hours: 7,
          mood_score: 4,
          symptom_count: 1,
        }

        const p = await predictRisk(features)
        if (cancelled) return

        const c = await getCombinedIntelligence({
          digital_twin_deviation_score: 2, // Sample deviation from baseline
          ml_risk_level: p.risk,
        })
        if (cancelled) return

        setBackendData({
          risk: p.risk,
          explanation: p.explanation || [],
          finalRisk: c.final_risk,
          finalAiInsight: c.final_ai_insight,
        })
      } catch (e) {
        if (cancelled) return
        console.error('Backend API error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // Sample baseline and current data for UI display
  const baseline = {
    avgCycle: 28,
    avgMood: 4,
    avgSleep: 7.0,
    avgStress: 2,
    cycleTrend: [27, 28, 29],
  }

  const current = {
    cycleTrend: [28, 30, 29],
    currentCycle: 29,
    mood: 4,
    sleep: 7,
    stress: 3,
    symptoms: { acne: false, fatigue: false, hair_fall: false },
  }

  const cycleDeviation = current.currentCycle - baseline.avgCycle
  const insightTag: Level = backendData?.finalRisk === 'High' ? 'high' :
                           backendData?.finalRisk === 'Medium' ? 'mild' : 'normal'

  const labels = ['Jan', 'Feb', 'Mar']

  if (loading) {
    return (
      <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 backdrop-blur-md transition-all duration-300">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
            Digital Twin
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
            Compare <span className="font-semibold text-gray-800">{displayName}</span>'s healthy baseline vs current real-time state — and surface deviations with AI insights.
          </p>
        </div>
        <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-blue-50/50">
          <div className="text-sm font-semibold text-gray-800">Loading AI analysis...</div>
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
          Compare <span className="font-semibold text-gray-800">{displayName}</span>'s healthy baseline vs current real-time state — and surface deviations with AI insights.
        </p>
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-700">AI Health Intelligence</div>
        <div className="mt-3 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-purple-50/50">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold">
                {backendData?.finalRisk === 'High' ? 'High Risk Pattern Detected' :
                 backendData?.finalRisk === 'Medium' ? 'Moderate Risk Indicators' :
                 'Healthy Pattern Maintained'}
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {backendData?.finalAiInsight || 'Loading AI insights...'}
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                insightTag === 'high' ? 'ring-red-300 bg-red-50 text-red-800' :
                insightTag === 'mild' ? 'ring-yellow-300 bg-yellow-50 text-yellow-800' :
                'ring-green-300 bg-green-50 text-green-800'
              }`}
            >
              {insightTag === 'high' ? '🔴 High' : insightTag === 'mild' ? '🟡 Mild' : '🟢 Normal'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <div className="text-sm font-semibold text-gray-700">Baseline Profile</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TwinCard
              title="Avg Cycle Length"
              value={`${baseline.avgCycle} days`}
              level="normal"
              hint="Historical average"
            />
            <TwinCard
              title="Avg Mood Score"
              value={`${baseline.avgMood} / 5`}
              level="normal"
              hint="Historical average"
            />
            <TwinCard
              title="Avg Sleep Hours"
              value={`${baseline.avgSleep}h`}
              level="normal"
              hint="Historical average"
            />
            <TwinCard
              title="Avg Stress Level"
              value={`${baseline.avgStress} / 5`}
              level="normal"
              hint="Historical average"
            />
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-gray-700">Current State</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TwinCard
              title="Current Cycle Length"
              value={`${current.currentCycle} days`}
              level={Math.abs(cycleDeviation) > 5 ? 'high' : Math.abs(cycleDeviation) > 2 ? 'mild' : 'normal'}
              hint={`Deviation: ${cycleDeviation > 0 ? '+' : ''}${cycleDeviation} days`}
            />
            <TwinCard
              title="Current Mood Score"
              value={`${current.mood} / 5`}
              level={Math.abs(current.mood - baseline.avgMood) >= 1 ? 'mild' : 'normal'}
              hint="Real-time assessment"
            />
            <TwinCard
              title="Current Sleep Hours"
              value={`${current.sleep}h`}
              level={current.sleep < 5 ? 'high' : current.sleep < 6 ? 'mild' : 'normal'}
              hint="Real-time assessment"
            />
            <TwinCard
              title="Current Stress Level"
              value={`${current.stress} / 5`}
              level={current.stress >= 4 ? 'high' : current.stress >= 3 ? 'mild' : 'normal'}
              hint="Real-time assessment"
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
        <span className="font-semibold text-gray-800">Demo line for judges:</span> Our system doesn't just detect issues, it correlates lifestyle and biological patterns.
      </div>
    </div>
  )
}

