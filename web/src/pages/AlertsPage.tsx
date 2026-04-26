import { useMemo } from 'react'
import { getCurrentUser } from '../auth'

type HealthEntry = {
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
    missed_period?: boolean
  }
}

type AlertLevel = 'high' | 'medium' | 'normal'
type AlertCard = { level: AlertLevel; title: string; explanation: string; reason: string }

function entryKey(userId: string) {
  return `shakticare_health_entries_v1:${userId}`
}

function userDataKey(email: string) {
  return `userData_${email.trim().toLowerCase()}`
}

function safeParseEntries(raw: string | null): HealthEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => e && typeof e === 'object') as HealthEntry[]
  } catch {
    return []
  }
}

function cycleLengthFromDates(start: string, end: string): number | null {
  if (!start || !end) return null
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return null
  const days = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
  if (days <= 0 || days > 80) return null
  return days
}

function levelStyles(level: AlertLevel) {
  if (level === 'high') return 'bg-rose-100/90 text-rose-950 ring-rose-300'
  if (level === 'medium') return 'bg-yellow-100/90 text-yellow-950 ring-yellow-300'
  return 'bg-emerald-100/90 text-emerald-950 ring-emerald-300'
}

function levelLabel(level: AlertLevel) {
  return level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Normal'
}

function buildAlerts(latest: HealthEntry, recent: HealthEntry[]): { alerts: AlertCard[]; insight: string } {
  const cycleLength = cycleLengthFromDates(
    latest.monthly.cycle_start_date,
    latest.monthly.cycle_end_date,
  )
  const stress = Number(latest.daily.stress_level)
  const sleep = Number(latest.daily.sleep_hours)
  const mood = Number(latest.daily.mood)
  const missed = Boolean(latest.monthly.missed_period)

  const irregularCycle =
    cycleLength !== null ? cycleLength < 26 || cycleLength > 32 : !latest.monthly.regularity

  const reasons: string[] = []
  const alerts: AlertCard[] = []

  const highTriggered =
    (stress >= 4 && sleep < 5) || (cycleLength !== null && cycleLength > 35) || missed

  const mediumTriggered =
    (stress >= 3 && mood <= 3) || irregularCycle

  if (highTriggered) {
    const why: string[] = []
    if (stress >= 4 && sleep < 5) why.push('High stress with low sleep')
    if (cycleLength !== null && cycleLength > 35) why.push(`Long cycle length (${cycleLength} days)`)
    if (missed) why.push('Missed period recorded')
    alerts.push({
      level: 'high',
      title: 'High risk alert',
      explanation: 'Hormonal imbalance pattern detected',
      reason: why.join(' • '),
    })
    reasons.push('stress/sleep and cycle patterns')
  } else if (mediumTriggered) {
    const why: string[] = []
    if (stress >= 3 && mood <= 3) why.push('Stress and mood pattern')
    if (irregularCycle) why.push('Cycle instability signal')
    alerts.push({
      level: 'medium',
      title: 'Medium risk alert',
      explanation: 'Cycle instability detected',
      reason: why.join(' • ') || 'Recent pattern variation detected',
    })
    reasons.push('cycle stability')
  } else {
    alerts.push({
      level: 'normal',
      title: 'Healthy pattern maintained',
      explanation: 'Your signals are within a balanced range',
      reason: 'Cycle, sleep, and stress signals look stable',
    })
  }

  // Extra: symptom-based note (kept as a normal/medium add-on)
  const sym = latest.weekly.symptoms || { acne: false, hairfall: false, fatigue: false }
  const symCount = [sym.acne, sym.hairfall, sym.fatigue].filter(Boolean).length
  if (symCount >= 2) {
    alerts.push({
      level: highTriggered ? 'high' : mediumTriggered ? 'medium' : 'medium',
      title: 'Symptoms check-in',
      explanation: 'Multiple symptoms logged this week',
      reason: [
        sym.acne ? 'acne' : null,
        sym.hairfall ? 'hairfall' : null,
        sym.fatigue ? 'fatigue' : null,
      ]
        .filter(Boolean)
        .join(', '),
    })
  }

  const recentCycles = recent
    .map((e) => cycleLengthFromDates(e.monthly.cycle_start_date, e.monthly.cycle_end_date))
    .filter((n): n is number => typeof n === 'number')

  const cycleTrend =
    recentCycles.length >= 2
      ? recentCycles[recentCycles.length - 1] - recentCycles[0]
      : 0

  const insightParts: string[] = []
  if (stress >= 4 && sleep < 5) {
    insightParts.push('stress and sleep are showing a strong correlation')
  }
  if (irregularCycle) {
    insightParts.push('cycle stability signals suggest irregularity')
  }
  if (cycleTrend >= 3) {
    insightParts.push('cycle duration appears to be trending longer')
  }

  const insight =
    insightParts.length > 0
      ? `Your ${insightParts.join(' and ')}.`
      : 'Your recent signals look stable. Keep tracking to maintain consistency.'

  return { alerts, insight }
}

export function AlertsPage() {
  const user = useMemo(() => getCurrentUser(), [])
  const userId = user?.user_id
  const userEmail = user?.email?.trim().toLowerCase()
  const demoUsers = [
    { email: 'asha@gmail.com' },
    { email: 'neha@gmail.com' },
    { email: 'kavya@gmail.com' },
    { email: 'pooja@gmail.com' },
    { email: 'riya@gmail.com' },
  ]
  const isCurrentUserDemo = !!user && demoUsers.some(
    (u) => u.email.trim().toLowerCase() === user.email.trim().toLowerCase(),
  )

  const { latest, recent } = useMemo(() => {
    if (!userId || !userEmail) return { latest: null as HealthEntry | null, recent: [] as HealthEntry[] }
    const localEntries = safeParseEntries(localStorage.getItem(userDataKey(userEmail)))
    const entries = localEntries.length
      ? localEntries
      : isCurrentUserDemo
      ? safeParseEntries(localStorage.getItem(entryKey(userId)))
      : []
    const latest = entries.at(-1) ?? null
    const recent = entries.slice(Math.max(0, entries.length - 6))
    return { latest, recent }
  }, [userId, userEmail, isCurrentUserDemo])

  const computed = useMemo(() => {
    if (!latest) return null
    return buildAlerts(latest, recent)
  }, [latest, recent])

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">Alerts</h1>
        <p className="text-sm text-gray-700">
          Dynamic health intelligence generated from your latest entries.
        </p>
      </div>

      {!latest ? (
        <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg">
          <div className="text-sm font-semibold text-gray-800">No data available to generate alerts</div>
          <div className="mt-2 text-sm text-gray-700">
            Add your daily, weekly, and monthly health signals in Data Entry.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg">
            <div className="text-sm font-semibold text-gray-700">AI Insight Summary</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">
              {computed?.insight ?? '—'}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(computed?.alerts ?? []).map((a, idx) => (
              <div
                key={`${a.title}-${idx}`}
                className={`rounded-2xl p-5 shadow-xl ring-1 backdrop-blur-lg ${levelStyles(a.level)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{a.title}</div>
                    <div className="mt-2 text-sm font-semibold">{a.explanation}</div>
                    <div className="mt-2 text-xs opacity-90">
                      <span className="font-bold">Reason:</span> {a.reason}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[11px] font-bold">
                    {levelLabel(a.level)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

