import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type DemoUser = { user_id: string; name?: string; email: string; password: string }

const defaultUsers: DemoUser[] = [
  { user_id: 'asha@gmail.com', email: 'asha@gmail.com', password: '1234' },
  { user_id: 'neha@gmail.com', email: 'neha@gmail.com', password: '1234' },
  { user_id: 'kavya@gmail.com', email: 'kavya@gmail.com', password: '1234' },
  { user_id: 'pooja@gmail.com', email: 'pooja@gmail.com', password: '1234' },
  { user_id: 'riya@gmail.com', email: 'riya@gmail.com', password: '1234' },
]

const USERS_KEY = 'shakticare_demo_users_v1'
const CURRENT_USER_KEY = 'currentUser'

function loadUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return defaultUsers
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return defaultUsers

    const safe = parsed.filter(
      (u): u is DemoUser =>
        typeof u === 'object' &&
        u !== null &&
        'user_id' in u &&
        'email' in u &&
        'password' in u &&
        typeof (u as { user_id: unknown }).user_id === 'string' &&
        typeof (u as { email: unknown }).email === 'string' &&
        typeof (u as { password: unknown }).password === 'string',
    )

    return safe.length ? safe : defaultUsers
  } catch {
    return defaultUsers
  }
}

function saveUsers(users: DemoUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function LoginPage() {
  const navigate = useNavigate()
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [users] = useState<DemoUser[]>(() => loadUsers())

  useEffect(() => {
    saveUsers(users)
  }, [users])

  const emailNormalized = useMemo(() => email.trim().toLowerCase(), [email])
  const passwordNormalized = useMemo(() => password.trim(), [password])

  const handleLogin = () => {
    const foundUser = users.find(
      (u) =>
        u.email.trim().toLowerCase() === emailNormalized &&
        u.password === passwordNormalized,
    )

    if (foundUser) {
      const currentUser = {
        user_id: foundUser.user_id,
        name: foundUser.name,
        email: foundUser.email,
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser))
      alert('Login successful')
      navigate('/dashboard')
      return
    }

    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]') as Array<{
      name: string
      email: string
      password: string
      isNewUser?: boolean
    }>

    const foundNewUser = storedUsers.find(
      (u) =>
        u.email.trim().toLowerCase() === emailNormalized &&
        u.password === passwordNormalized,
    )

    if (foundNewUser) {
      const currentUser = {
        user_id: foundNewUser.email,
        name: foundNewUser.name,
        email: foundNewUser.email,
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser))
      alert('Login successful')
      navigate('/data-entry')
    } else {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="app-bg flex items-center justify-center px-6">
      <div className="glass-card w-full max-w-md p-6 md:p-8 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 backdrop-blur-md transition-all duration-300">
        <div className="text-center">
          <div className="text-sm font-semibold text-white/90">ShaktiCare AI</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
            Login
          </h1>
          <p className="mt-2 text-sm text-white/85">
            Enter your credentials to continue.
          </p>
        </div>

        <form
          className="relative mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
        >
          <div>
            <label htmlFor={emailId} className="text-sm font-medium text-white/90">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-glass mt-2 transition-all duration-300 hover:scale-105"
            />
          </div>

          <div>
            <label
              htmlFor={passwordId}
              className="text-sm font-medium text-white/90"
            >
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-glass mt-2 transition-all duration-300 hover:scale-105"
            />
          </div>

          <button
            type="submit"
            className="btn-grad mt-2 h-11 w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Login
          </button>
        </form>

        <div className="relative mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="btn-ghost px-3 transition-all duration-300 hover:scale-105"
          >
            Sign Up
          </button>

          <Link
            to="/"
            className="text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 transition-all duration-300 hover:scale-105 hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

