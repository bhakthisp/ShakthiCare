import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type DemoUser = { name?: string; email: string; password: string }

type NewUser = { name: string; email: string; password: string; isNewUser: true }

const defaultUsers: DemoUser[] = [
  { email: 'asha@gmail.com', password: '1234' },
  { email: 'neha@gmail.com', password: '1234' },
  { email: 'kavya@gmail.com', password: '1234' },
  { email: 'pooja@gmail.com', password: '1234' },
  { email: 'riya@gmail.com', password: '1234' },
]

const NEW_USERS_KEY = 'users'

function loadStoredUsers(): NewUser[] {
  try {
    const raw = localStorage.getItem(NEW_USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (u): u is NewUser =>
        typeof u === 'object' &&
        u !== null &&
        'name' in u &&
        'email' in u &&
        'password' in u &&
        'isNewUser' in u &&
        typeof (u as { name: unknown }).name === 'string' &&
        typeof (u as { email: unknown }).email === 'string' &&
        typeof (u as { password: unknown }).password === 'string' &&
        (u as { isNewUser: unknown }).isNewUser === true,
    )
  } catch {
    return []
  }
}

function saveStoredUsers(users: NewUser[]) {
  localStorage.setItem(NEW_USERS_KEY, JSON.stringify(users))
}

export function SignupPage() {
  const navigate = useNavigate()
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState<NewUser[]>(() => loadStoredUsers())

  useEffect(() => {
    saveStoredUsers(users)
  }, [users])

  const nameNormalized = useMemo(() => name.trim(), [name])
  const emailNormalized = useMemo(() => email.trim().toLowerCase(), [email])
  const passwordNormalized = useMemo(() => password.trim(), [password])

  const handleCreateAccount = () => {
    if (!nameNormalized || !emailNormalized || !passwordNormalized) {
      alert('Please fill all fields')
      return
    }

    const alreadyExists =
      users.some((u) => u.email.trim().toLowerCase() === emailNormalized) ||
      defaultUsers.some((u) => u.email.trim().toLowerCase() === emailNormalized)

    if (alreadyExists) {
      alert('Email already exists. Please login.')
      navigate('/login')
      return
    }

    setUsers((prev) => [
      ...prev,
      { name: nameNormalized, email: emailNormalized, password: passwordNormalized, isNewUser: true },
    ])

    alert('Account created successfully!')
    navigate('/login')
  }

  return (
    <div className="app-bg flex items-center justify-center px-6">
      <div className="glass-card w-full max-w-md p-6 md:p-8">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-800">ShaktiCare AI</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-800">
            Sign Up
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Create your account to continue.
          </p>
        </div>

        <form
          className="relative mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleCreateAccount()
          }}
        >
          <div>
            <label htmlFor={nameId} className="text-sm font-semibold text-gray-800">
              Name
            </label>
            <input
              id={nameId}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="input-glass mt-2"
            />
          </div>

          <div>
            <label htmlFor={emailId} className="text-sm font-semibold text-gray-800">
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
              className="input-glass mt-2"
            />
          </div>

          <div>
            <label
              htmlFor={passwordId}
              className="text-sm font-semibold text-gray-800"
            >
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="input-glass mt-2"
            />
          </div>

          <button
            type="submit"
            className="btn-grad mt-2 h-11 w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          >
            Create Account
          </button>
        </form>

        <div className="relative mt-4 flex items-center justify-center gap-2 text-sm text-gray-700">
          <span>Already have an account?</span>
          <Link
            to="/login"
            className="font-bold text-gray-800 underline decoration-gray-400/60 underline-offset-4 transition hover:text-gray-900"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

