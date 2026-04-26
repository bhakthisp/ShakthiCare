import { useNavigate } from 'react-router-dom'

const highlights = [
  { icon: '✨', label: 'Predict Early' },
  { icon: '🛡️', label: 'Prevent Complications' },
  { icon: '🌸', label: 'Empower Women' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="app-bg flex items-center justify-center">
      <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="btn-ghost bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          >
            Signup
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-grad focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          >
            Login
          </button>
        </div>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-800 md:text-6xl">
          ShaktiCare AI
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-800/90 md:text-lg">
          AI-Powered Women's Health Digital Twin for Early PCOD Risk Prediction
        </p>

        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-gray-700 md:text-base">
          Empowering Women's Health Through Intelligent Prediction
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="glass-card inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-800 transition hover:scale-[1.02]"
            >
              <span aria-hidden="true">{h.icon}</span>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

