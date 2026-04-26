import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../auth'

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function Logo() {
  return (
    <Link to="/dashboard" className="group inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/60 ring-1 ring-white/35 shadow-sm backdrop-blur">
        <span className="text-sm font-black text-gray-900">S</span>
      </span>
      <span className="text-sm font-extrabold tracking-tight text-gray-900">
        ShaktiCare <span className="text-gray-700">AI</span>
      </span>
    </Link>
  )
}

function Item({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          'rounded-full px-4 py-2 text-sm font-semibold transition',
          isActive
            ? 'bg-white/70 text-gray-900 ring-1 ring-white/40'
            : 'text-gray-800 hover:bg-white/40 hover:ring-1 hover:ring-white/30',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function TopNav() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const user = useMemo(() => getCurrentUser(), [])
  const initials = useMemo(() => {
    const name = user?.name?.trim()
    if (name) return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
    const email = user?.email || 'U'
    return email[0]?.toUpperCase() || 'U'
  }, [user])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return
      const el = menuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/25 bg-white/35 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <Logo />
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <Item to="/dashboard">Dashboard</Item>
          <Item to="/data-entry">Data Entry</Item>
          <Item to="/digital-twin">Digital Twin</Item>
          <Item to="/community">Community</Item>
          <Item to="/resources">Resources</Item>
        </nav>

        <div className="flex items-center gap-2">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-sm font-extrabold text-gray-900 ring-1 ring-white/35 shadow-sm transition hover:bg-white/70"
              aria-label="Profile menu"
              aria-expanded={open}
            >
              {initials}
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/35 bg-white/80 shadow-xl backdrop-blur-xl">
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-gray-800 transition hover:bg-white"
                  onClick={() => {
                    setOpen(false)
                    navigate('/profile')
                  }}
                >
                  Profile
                </button>
                <div className="h-px bg-white/60" />
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-white"
                  onClick={() => {
                    setOpen(false)
                    logout()
                    navigate('/login', { replace: true })
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          <Item to="/dashboard">Dashboard</Item>
          <Item to="/data-entry">Data Entry</Item>
          <Item to="/digital-twin">Digital Twin</Item>
          <Item to="/community">Community</Item>
          <Item to="/resources">Resources</Item>
        </div>
      </div>
    </header>
  )
}

