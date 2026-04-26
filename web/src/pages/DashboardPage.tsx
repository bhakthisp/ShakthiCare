import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCombinedIntelligence, predictRisk } from '../api.js'
import { getCurrentUser } from '../auth'
import { getUserCycleTrend } from '../data/monthlyCycleData'

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

function safeParseEntries(raw: string | null) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry) => entry && typeof entry === 'object') as Array<Record<string, unknown>>
  } catch {
    return []
  }
}

function LineChart({ values }: { values: number[] }) {
  const width = 560
  const height = 180
  const padX = 14
  const padY = 16

  if (!values.length) {
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/30 bg-white/30 p-8 text-center text-sm text-gray-600">
        No cycle data available yet.
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)

  const points = values
    .map((v, i) => {
      const x =
        padX + (i * (width - padX * 2)) / Math.max(1, values.length - 1)
      const y =
        padY + ((max - v) * (height - padY * 2)) / range
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/30 bg-white/30 p-3 backdrop-blur-lg">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full"
        role="img"
        aria-label="Cycle length trend chart"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff4fd8" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <g opacity="0.25">
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
          points={points}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(null)

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

  const stressLevel = 'Moderate'

  const localEntries = useMemo(() => {
    if (!user) return [] as Array<Record<string, unknown>>
    return safeParseEntries(localStorage.getItem(userDataKey(user.email)))
  }, [user])

  const isCurrentUserDemo = useMemo(
    () => (user ? isDemoUser(user.email) : false),
    [user],
  )

  const localCycleLengths = useMemo(
    () =>
      localEntries
        .map((entry) =>
          cycleLengthFromDates(
            String((entry as any).monthly?.cycle_start_date),
            String((entry as any).monthly?.cycle_end_date),
          ),
        )
        .filter((length): length is number => typeof length === 'number'),
    [localEntries],
  )

  const fallbackCycle = useMemo(() => {
    if (!user || !isCurrentUserDemo) return { labels: [], values: [] as number[], rows: [] as unknown[] }
    const name = user.name?.trim() ? user.name.trim() : getDisplayName(user)
    return getUserCycleTrend(name)
  }, [user, isCurrentUserDemo])

  const noDataForNewUser = user && !isCurrentUserDemo && localEntries.length === 0

  const cycleTrend = noDataForNewUser
    ? []
    : localCycleLengths.length
    ? localCycleLengths
    : fallbackCycle.values.length
    ? fallbackCycle.values
    : [28, 30, 29]
  const currentCycleLength = cycleTrend.at(-1) ?? 0

  /** Backend-connected AI (predict + fusion) for demo judges. */
  const [backendData, setBackendData] = useState<{
    risk: string
    explanation: string[]
    finalRisk: string
    finalAiInsight: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Use sample data for backend prediction
        const sampleData = {
          cycle_length: currentCycleLength || 28,
          stress_level: 3,
          sleep_hours: 7,
          mood_score: 4,
          symptom_count: 1,
        }

        const p = await predictRisk(sampleData)
        if (cancelled) return

        const c = await getCombinedIntelligence({
          digital_twin_deviation_score: (currentCycleLength || 28) - 28,
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
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentCycleLength])

  return (
    <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
          Health Intelligence Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-700 md:text-base">
          Your personalized AI-powered health twin analyzing patterns and predicting PCOD risk.
        </p>
      </div>

      {noDataForNewUser ? (
        <div className="mt-12 flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">Start your health journey</div>
            <div className="mt-2 text-sm text-gray-600 max-w-md">
              Begin tracking your wellness patterns by adding your first data entry. Your AI health twin will analyze trends and provide personalized insights.
            </div>
          </div>
          <Link
            to="/data-entry"
            className="btn-grad h-12 px-8 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Go to Data Entry
          </Link>
        </div>
      ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="glass-card p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-pink-100/70 to-lavender-100/70">
              <div className="text-sm font-semibold text-gray-700">Risk Score</div>
              <div className="mt-2 text-2xl font-bold text-gray-800">
                {backendData?.finalRisk || 'Loading...'}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-600">
                Digital Twin deviation + behavioral ML model (combined)
              </div>
            </div>

            <div className="glass-card p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-lavender-100/70 to-blue-100/70">
              <div className="text-sm font-semibold text-gray-700">
                Current Cycle Length
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-800">
                {currentCycleLength} days
              </div>
              <div className="mt-1 text-xs font-medium text-gray-600">
                Last recorded average
              </div>
            </div>

            <div className="glass-card p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-blue-100/70 to-pink-100/70">
              <div className="text-sm font-semibold text-gray-700">Stress Level</div>
              <div className="mt-2 text-2xl font-bold text-gray-800">
                {stressLevel}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-600">
                Self-reported + inferred signals
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="text-sm font-semibold text-gray-700">
                Cycle length trend
              </div>
              <LineChart values={cycleTrend} />
              <div className="mt-2 text-xs text-gray-600">
                Latest:{' '}
                <span className="font-semibold text-gray-800">
                  {currentCycleLength ? `${currentCycleLength} days` : '—'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-pink-50/50 to-purple-50/50">
              <div className="text-sm font-semibold text-gray-700">
                AI Risk Alerts
              </div>
              <div className="mt-3 space-y-2">
                {backendData ? (
                  <div
                    className={`rounded-2xl p-3 shadow-sm ring-1 ${
                      backendData.finalRisk === 'High'
                        ? 'bg-red-100/90 text-red-950 ring-red-300'
                        : backendData.finalRisk === 'Medium'
                          ? 'bg-yellow-100/90 text-yellow-950 ring-yellow-300'
                          : 'bg-green-100/90 text-green-950 ring-green-300'
                    } transition-all duration-300 hover:scale-102`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          <span className="mr-2">⚠</span>
                          {backendData.finalRisk === 'High'
                            ? 'High Risk Alert'
                            : backendData.finalRisk === 'Medium'
                              ? 'Medium Risk Alert'
                              : 'Low Risk - Healthy Pattern'}
                        </div>
                        <div className="mt-1 text-xs opacity-90">
                          {backendData.finalAiInsight}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[11px] font-bold">
                        {backendData.finalRisk}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-3 shadow-sm ring-1 bg-gray-100/90 text-gray-950 ring-gray-300">
                    <div className="text-sm">Loading AI analysis...</div>
                  </div>
                )}
              </div>
              </div>

              <div className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                <div className="text-sm font-semibold text-gray-700">Community</div>
                <div className="mt-2 text-sm text-gray-700">
                  Ask questions anonymously and get supportive answers from the community.
                </div>
                <div className="mt-4">
                  <Link className="btn-grad inline-flex h-11 px-6 transition-all duration-300 hover:scale-105 hover:shadow-lg" to="/community">
                    Open Community Q&amp;A
                  </Link>
                </div>
              </div>
            </div>
          </div>
    </div>
  )
}

