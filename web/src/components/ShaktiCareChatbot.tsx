import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const NOUPE_SCRIPT_SRC =
  'https://www.noupe.com/embed/019b44a7f0b47dcaba37ef8f77c4df56f492.js'

/** Paths that must not show the chat widget (landing + auth entry). */
const EXCLUDED_PATHS = new Set<string>(['/', '/login', '/signup'])

/**
 * Third-party chat embed, mounted only on allowed routes.
 * Stays outside `<Routes />` so it never participates in layout swaps or route elements.
 */
export function ShaktiCareChatbot() {
  const { pathname } = useLocation()
  const hostRef = useRef<HTMLDivElement>(null)
  const excluded = EXCLUDED_PATHS.has(pathname)

  // Only [excluded]: do not re-inject the embed on in-app route changes (e.g. /dashboard → /digital-twin).
  useEffect(() => {
    if (excluded) {
      return
    }

    const host = hostRef.current
    if (!host) return
    if (host.querySelector('script[data-shakti-care-chatbot]')) {
      return
    }

    const script = document.createElement('script')
    script.src = NOUPE_SCRIPT_SRC
    script.async = true
    script.setAttribute('data-shakti-care-chatbot', '1')
    host.appendChild(script)

    return () => {
      host.replaceChildren()
    }
  }, [excluded])

  if (excluded) return null

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] max-w-full [&_*]:pointer-events-auto"
      aria-label="ShaktiCare support chat"
    >
      <div ref={hostRef} className="shakti-care-chatbot-host" />
    </div>
  )
}
