export type CurrentUser = { user_id: string; name?: string; email: string }

export const CURRENT_USER_KEY = 'currentUser'

export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'user_id' in parsed &&
      typeof (parsed as { user_id: unknown }).user_id === 'string' &&
      'email' in parsed &&
      typeof (parsed as { email: unknown }).email === 'string'
    ) {
      return parsed as CurrentUser
    }
    return null
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

