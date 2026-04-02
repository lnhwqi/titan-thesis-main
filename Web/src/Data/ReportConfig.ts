const KEY = "titan_report_window_hours"
const DEFAULT_HOURS = 72

export function getReportWindowHours(): number {
  const raw = localStorage.getItem(KEY)
  if (raw == null) {
    return DEFAULT_HOURS
  }

  const value = Number(raw)
  if (Number.isFinite(value) === false || value <= 0) {
    return DEFAULT_HOURS
  }

  return Math.floor(value)
}

export function setReportWindowHours(value: number): number {
  const safe =
    Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_HOURS
  localStorage.setItem(KEY, String(safe))
  return safe
}

export function reportWindowDeadline(orderCreatedAt: number): number {
  return orderCreatedAt + getReportWindowHours() * 60 * 60 * 1000
}

export function canReportDeliveredOrder(orderCreatedAt: number): boolean {
  return Date.now() <= reportWindowDeadline(orderCreatedAt)
}
