import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addHealthData } from '../api.js'
import { getCurrentUser } from '../auth'

type Daily = { mood: number; sleep_hours: number; stress_level: number }
type Weekly = {
  weight: number
  exercise_minutes: number
  symptoms: { acne: boolean; hairfall: boolean; fatigue: boolean }
}
type Monthly = {
  cycle_start_date: string
  cycle_end_date: string
  pain_level: number
  regularity: boolean
  missed_period?: boolean
}

type HealthEntry = {
  user_id: string
  timestamp: number
  daily: Daily
  weekly: Weekly
  monthly: Monthly
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

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

export function DataEntryPage() {
  const navigate = useNavigate()
  const user = useMemo(() => getCurrentUser(), [])
  const userId = user?.user_id || user?.email || 'unknown'
  const userEmail = user?.email?.trim().toLowerCase() ?? ''

  useEffect(() => {
    if (!userEmail) {
      navigate('/login', { replace: true })
    }
  }, [navigate, userEmail])

  const [dailyMood, setDailyMood] = useState(4)
  const [dailySleep, setDailySleep] = useState(7)
  const [dailyStress, setDailyStress] = useState(2)

  const [weeklyWeight, setWeeklyWeight] = useState(55)
  const [weeklyExerciseMinutes, setWeeklyExerciseMinutes] = useState(0)
  const [symAcne, setSymAcne] = useState(false)
  const [symHairfall, setSymHairfall] = useState(false)
  const [symFatigue, setSymFatigue] = useState(false)

  const [cycleStart, setCycleStart] = useState('')
  const [cycleEnd, setCycleEnd] = useState('')
  const [monthlyPain, setMonthlyPain] = useState(1)
  const [monthlyRegular, setMonthlyRegular] = useState(true)
  const [missedPeriod, setMissedPeriod] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastEntry, setLastEntry] = useState<HealthEntry | null>(null)

  useEffect(() => {
    if (!userEmail) {
      return
    }
    const entries = safeParseEntries(localStorage.getItem(userDataKey(userEmail)))
    setLastEntry(entries.at(-1) ?? null)
  }, [userEmail])

  const entry: HealthEntry = useMemo(
    () => ({
      user_id: userId,
      timestamp: Date.now(),
      daily: {
        mood: Number(dailyMood),
        sleep_hours: Number(dailySleep),
        stress_level: Number(dailyStress),
      },
      weekly: {
        weight: Number(weeklyWeight),
        exercise_minutes: Number(weeklyExerciseMinutes),
        symptoms: { acne: symAcne, hairfall: symHairfall, fatigue: symFatigue },
      },
      monthly: {
        cycle_start_date: String(cycleStart),
        cycle_end_date: String(cycleEnd),
        pain_level: Number(monthlyPain),
        regularity: Boolean(monthlyRegular),
        missed_period: Boolean(missedPeriod),
      },
    }),
    [
      userId,
      dailyMood,
      dailySleep,
      dailyStress,
      weeklyWeight,
      weeklyExerciseMinutes,
      symAcne,
      symHairfall,
      symFatigue,
      cycleStart,
      cycleEnd,
      monthlyPain,
      monthlyRegular,
      missedPeriod,
    ],
  )

  const summary = useMemo(() => {
    return [
      `Mood ${entry.daily.mood}/5`,
      `${entry.daily.sleep_hours.toFixed(1)}h sleep`,
      `Stress ${entry.daily.stress_level}/5`,
      `Weight ${entry.weekly.weight.toFixed(1)} kg`,
      `Exercise ${entry.weekly.exercise_minutes} min`,
      `Symptoms: ${[
        entry.weekly.symptoms.acne ? 'acne' : null,
        entry.weekly.symptoms.hairfall ? 'hairfall' : null,
        entry.weekly.symptoms.fatigue ? 'fatigue' : null,
      ]
        .filter(Boolean)
        .join(', ') || 'none'}`,
      `Cycle: ${entry.monthly.cycle_start_date || '—'} → ${entry.monthly.cycle_end_date || '—'}`,
      `Pain ${entry.monthly.pain_level}/5`,
      `Regular: ${entry.monthly.regularity ? 'Yes' : 'No'}`,
      entry.monthly.missed_period ? 'Missed period: Yes' : 'Missed period: No',
    ]
  }, [entry])

  return (
    <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
          Data Entry
        </h1>
        <p className="max-w-3xl text-sm text-gray-700">
          Record daily, weekly, and monthly signals. Entries are appended and saved to your profile.
        </p>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          setSuccess(null)
          setError(null)

          try {
            if (!userEmail) {
              setError('Unable to save data without a valid user session.')
              return
            }

            const key = userDataKey(userEmail)
            const prev = safeParseEntries(localStorage.getItem(key))
            const next = [...prev, entry]
            localStorage.setItem(key, JSON.stringify(next))
            setLastEntry(entry)

            // Send to backend if endpoint exists (best-effort, does not block UX)
            try {
              await addHealthData(entry)
            } catch {
              // ignore silently (offline/demo-safe)
            }

            setSuccess('Data updated successfully')
          } catch {
            setError('Unable to save right now.')
          } finally {
            setLoading(false)
          }
        }}
      >
        <section className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-purple-50/50">
          <div className="text-sm font-semibold text-gray-700">Daily</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Mood (1–5)</div>
              <input
                type="number"
                min={1}
                max={5}
                value={dailyMood}
                onChange={(e) => setDailyMood(Number(e.target.value))}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Sleep hours</div>
              <input
                type="number"
                min={0}
                max={14}
                step={0.1}
                value={dailySleep}
                onChange={(e) => setDailySleep(Number(e.target.value))}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Stress level (0–5)</div>
              <input
                type="number"
                min={0}
                max={5}
                value={dailyStress}
                onChange={(e) => setDailyStress(Number(e.target.value))}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <div className="text-sm font-semibold text-gray-700">Weekly</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Weight (kg)</div>
              <input
                type="number"
                min={0}
                step={0.1}
                value={weeklyWeight}
                onChange={(e) => setWeeklyWeight(Number(e.target.value))}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Exercise (minutes)</div>
              <input
                type="number"
                min={0}
                step={1}
                value={weeklyExerciseMinutes}
                onChange={(e) => setWeeklyExerciseMinutes(Number(e.target.value))}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <div className="block">
              <div className="text-sm font-semibold text-gray-700">Symptoms</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { key: 'acne', label: 'Acne', on: symAcne, set: setSymAcne },
                  { key: 'hairfall', label: 'Hairfall', on: symHairfall, set: setSymHairfall },
                  { key: 'fatigue', label: 'Fatigue', on: symFatigue, set: setSymFatigue },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => s.set(!s.on)}
                    className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition-all duration-300 hover:scale-105 ${
                      s.on
                        ? 'bg-fuchsia-100/80 text-fuchsia-900 ring-fuchsia-200/70'
                        : 'bg-white/55 text-gray-800 ring-white/35 hover:bg-white/70'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-blue-50/50">
          <div className="text-sm font-semibold text-gray-700">Monthly</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Cycle start date</div>
              <input
                type="date"
                value={cycleStart}
                onChange={(e) => setCycleStart(e.target.value)}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Cycle end date</div>
              <input
                type="date"
                value={cycleEnd}
                onChange={(e) => setCycleEnd(e.target.value)}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Pain level (1–5)</div>
              <input
                type="number"
                min={1}
                max={5}
                value={monthlyPain}
                onChange={(e) => setMonthlyPain(Number(e.target.value))}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-gray-700">Regularity</div>
              <select
                value={monthlyRegular ? 'yes' : 'no'}
                onChange={(e) => setMonthlyRegular(e.target.value === 'yes')}
                className="input-glass mt-2 transition-all duration-300 hover:scale-105"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <div className="block">
              <div className="text-sm font-semibold text-gray-700">Missed period</div>
              <button
                type="button"
                onClick={() => setMissedPeriod((v) => !v)}
                className={`mt-2 inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold ring-1 transition-all duration-300 hover:scale-105 ${
                  missedPeriod
                    ? 'bg-rose-100/80 text-rose-900 ring-rose-200/70'
                    : 'bg-white/55 text-gray-800 ring-white/35 hover:bg-white/70'
                }`}
              >
                {missedPeriod ? 'Yes (missed)' : 'No'}
              </button>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-grad h-11 px-6 transition-all duration-300 hover:scale-105 hover:shadow-lg" disabled={loading}>
            {loading ? 'Saving…' : 'Save Health Data'}
          </button>
          {success ? <div className="text-sm font-semibold text-emerald-800">{success}</div> : null}
          {error ? <div className="text-sm font-semibold text-rose-800">{error}</div> : null}
        </div>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50/50 to-purple-50/50">
          <div className="text-sm font-semibold text-gray-700">Confirmation summary</div>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            {summary.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                <span className="font-semibold text-gray-800">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <div className="text-sm font-semibold text-gray-700">Last submitted entry</div>
          {lastEntry ? (
            <div className="mt-3 text-sm text-gray-700">
              <div className="font-semibold text-gray-800">{fmt(lastEntry.timestamp)}</div>
              <div className="mt-2">
                Daily: mood {lastEntry.daily.mood}/5, sleep {lastEntry.daily.sleep_hours}h, stress {lastEntry.daily.stress_level}/5
              </div>
              <div className="mt-1">
                Weekly: weight {lastEntry.weekly.weight} kg, exercise {lastEntry.weekly.exercise_minutes} min
              </div>
              <div className="mt-1">
                Monthly: {lastEntry.monthly.cycle_start_date || '—'} → {lastEntry.monthly.cycle_end_date || '—'}, pain {lastEntry.monthly.pain_level}/5, regular {lastEntry.monthly.regularity ? 'Yes' : 'No'}
              </div>
              <div className="mt-1">
                Missed period: {lastEntry.monthly.missed_period ? 'Yes' : 'No'}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-700">No entries yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

