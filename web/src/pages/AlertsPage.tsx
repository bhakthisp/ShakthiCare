import { useEffect, useMemo, useState } from 'react'
import { getCombinedIntelligence, predictRisk } from '../api.js'

type AlertLevel = 'high' | 'medium' | 'normal'

function levelStyles(level: AlertLevel) {
  if (level === 'high') return 'bg-rose-100/90 text-rose-950 ring-rose-300'
  if (level === 'medium') return 'bg-yellow-100/90 text-yellow-950 ring-yellow-300'
  return 'bg-emerald-100/90 text-emerald-950 ring-emerald-300'
}

function levelLabel(level: AlertLevel) {
  return level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Normal'
}

export function AlertsPage() {
  const [backendData, setBackendData] = useState<{
    risk: string
    explanation: string[]
    finalRisk: string
    finalAiInsight: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        // Use sample data for backend prediction - in a real app, this would come from user data
        const sampleData = {
          cycle_length: 30,
          stress_level: 3,
          sleep_hours: 7,
          mood_score: 4,
          symptom_count: 1,
        }

        const p = await predictRisk(sampleData)
        if (cancelled) return

        const c = await getCombinedIntelligence({
          digital_twin_deviation_score: 2, // Sample deviation
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
  }, [])

  const alerts = useMemo(() => {
    if (!backendData) return []

    const level: AlertLevel = backendData.finalRisk === 'High' ? 'high' :
                  backendData.finalRisk === 'Medium' ? 'medium' : 'normal'

    return [{
      level,
      title: backendData.finalRisk === 'High' ? 'High Risk Alert' :
             backendData.finalRisk === 'Medium' ? 'Medium Risk Alert' :
             'Healthy Pattern Detected',
      explanation: backendData.finalAiInsight,
      reason: backendData.explanation.join(' • '),
    }]
  }, [backendData])

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">Alerts</h1>
        <p className="text-sm text-gray-700">
          Dynamic health intelligence generated from your latest entries.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg">
          <div className="text-sm font-semibold text-gray-800">Loading AI analysis...</div>
        </div>
      ) : !backendData ? (
        <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg">
          <div className="text-sm font-semibold text-gray-800">Unable to load alerts</div>
          <div className="mt-2 text-sm text-gray-700">
            Please check your connection and try again.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg">
            <div className="text-sm font-semibold text-gray-700">AI Insight Summary</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">
              {backendData.finalAiInsight}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {alerts.map((a, idx) => (
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