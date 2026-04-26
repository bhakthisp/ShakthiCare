import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../auth'

type CurrentUser = { user_id: string; name?: string; email: string }

export function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      navigate('/login', { replace: true })
      return
    }
    setUser(u)
  }, [navigate])

  const displayName = useMemo(() => {
    if (!user) return 'User'
    if (user.name && user.name.trim()) return user.name.trim()
    return user.email.split('@')[0] || 'User'
  }, [user])

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
          Profile
        </h1>
        <p className="text-sm text-gray-700">
          Logged in as <span className="font-semibold text-gray-800">{displayName}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <div className="text-sm font-semibold text-gray-700">Account</div>
          <div className="mt-2 text-sm text-gray-800">
            <div>
              <span className="font-semibold">User ID:</span> {user?.user_id ?? '—'}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {user?.email ?? '—'}
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="text-sm font-semibold text-gray-700">Privacy</div>
          <div className="mt-2 text-sm text-gray-800">
            Your data stays on-device for this demo. Sign out anytime from the profile menu.
          </div>
        </div>
      </div>
    </div>
  )
}

