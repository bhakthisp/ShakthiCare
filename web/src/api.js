export const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

const CURRENT_USER_KEY = 'currentUser'

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && typeof parsed.user_id === 'string') {
      return parsed.user_id
    }
    return null
  } catch {
    return null
  }
}

function isLikelyServerDown(err) {
  const msg = String(err?.message || err)
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ERR_CONNECTION_REFUSED')
  )
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const url = `${BASE_URL}${path}`
  const user_id = getCurrentUserId()
  const payload =
    body && typeof body === 'object' && body !== null
      ? user_id
        ? { ...body, user_id }
        : body
      : body

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload === undefined || method === 'GET' ? undefined : JSON.stringify(payload),
    })

    const text = await res.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }

    if (!res.ok) {
      const msg =
        (data && typeof data === 'object' && data.error) ||
        `Request failed (${res.status})`
      const e = new Error(msg)
      e.status = res.status
      e.data = data
      throw e
    }

    return data
  } catch (err) {
    if (isLikelyServerDown(err)) {
      const e = new Error('Server not running')
      e.code = 'SERVER_OFF'
      throw e
    }
    throw err
  }
}

export function predictRisk(data) {
  return requestJson('/predict', { method: 'POST', body: data })
}

export function getCombinedIntelligence(data) {
  return requestJson('/combined-intelligence', { method: 'POST', body: data })
}

export function checkHealth() {
  return requestJson('/health', { method: 'GET' })
}

export function addHealthData(data) {
  return requestJson('/add-data', { method: 'POST', body: data })
}

