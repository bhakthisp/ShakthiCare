export type MonthlyCycleRow = {
  user: string
  month: string
  cycle_length: number
  pain_level: number
  missed_period: 'Yes' | 'No'
  irregular: 'Yes' | 'No'
}

// Source: project root `monthly_data.csv` (hackathon-friendly: hardcoded for now).
export const monthlyCycleData: MonthlyCycleRow[] = [
  { user: 'Asha', month: 'Jan', cycle_length: 42, pain_level: 4, missed_period: 'No', irregular: 'Yes' },
  { user: 'Asha', month: 'Feb', cycle_length: 0, pain_level: 0, missed_period: 'Yes', irregular: 'Yes' },
  { user: 'Asha', month: 'Mar', cycle_length: 45, pain_level: 3, missed_period: 'No', irregular: 'Yes' },
  { user: 'Neha', month: 'Jan', cycle_length: 26, pain_level: 2, missed_period: 'No', irregular: 'No' },
  { user: 'Neha', month: 'Feb', cycle_length: 27, pain_level: 2, missed_period: 'No', irregular: 'No' },
  { user: 'Neha', month: 'Mar', cycle_length: 29, pain_level: 3, missed_period: 'No', irregular: 'No' },
  { user: 'Kavya', month: 'Jan', cycle_length: 50, pain_level: 3, missed_period: 'No', irregular: 'Yes' },
  { user: 'Kavya', month: 'Feb', cycle_length: 38, pain_level: 3, missed_period: 'No', irregular: 'Yes' },
  { user: 'Kavya', month: 'Mar', cycle_length: 0, pain_level: 0, missed_period: 'Yes', irregular: 'Yes' },
  { user: 'Pooja', month: 'Jan', cycle_length: 26, pain_level: 2, missed_period: 'No', irregular: 'No' },
  { user: 'Pooja', month: 'Feb', cycle_length: 30, pain_level: 3, missed_period: 'No', irregular: 'No' },
  { user: 'Pooja', month: 'Mar', cycle_length: 28, pain_level: 1, missed_period: 'No', irregular: 'No' },
  { user: 'Riya', month: 'Jan', cycle_length: 0, pain_level: 0, missed_period: 'Yes', irregular: 'Yes' },
  { user: 'Riya', month: 'Feb', cycle_length: 46, pain_level: 4, missed_period: 'No', irregular: 'Yes' },
  { user: 'Riya', month: 'Mar', cycle_length: 0, pain_level: 0, missed_period: 'Yes', irregular: 'Yes' },
]

export function getUserCycleTrend(userName: string) {
  const months = ['Jan', 'Feb', 'Mar']
  const rows = monthlyCycleData
    .filter((r) => r.user.toLowerCase() === userName.toLowerCase())
    .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month))

  const labels = rows.map((r) => r.month)
  const values = rows.map((r) => r.cycle_length).filter((n) => n > 0)

  return { rows, labels, values }
}

export function getLatestUserMonth(userName: string) {
  const months = ['Jan', 'Feb', 'Mar']
  const rows = monthlyCycleData
    .filter((r) => r.user.toLowerCase() === userName.toLowerCase())
    .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month))
  return rows.at(-1) ?? null
}

