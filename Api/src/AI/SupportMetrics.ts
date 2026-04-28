export type SupportMetricEvent =
  | "REQUEST_RECEIVED"
  | "REQUEST_REJECTED"
  | "REQUEST_RATE_LIMITED"
  | "ANSWER_GENERATED"
  | "ANSWER_SKIPPED"
  | "ANSWER_DELIVERED"
  | "ANSWER_FAILED"
  | "FALLBACK_DELIVERED"
  | "RATE_LIMIT_MAP_CLEANUP"

type SupportEventCounters = {
  REQUEST_RECEIVED: number
  REQUEST_REJECTED: number
  REQUEST_RATE_LIMITED: number
  ANSWER_GENERATED: number
  ANSWER_SKIPPED: number
  ANSWER_DELIVERED: number
  ANSWER_FAILED: number
  FALLBACK_DELIVERED: number
  RATE_LIMIT_MAP_CLEANUP: number
}

export type SupportEventCounter = {
  event: SupportMetricEvent
  count: number
}

export type SupportMetricsSnapshot = {
  generatedAt: string
  startedAt: string
  uptimeSeconds: number
  lastEventAt: string | null
  counters: SupportEventCounter[]
  totals: {
    requests: number
    rejected: number
    rateLimited: number
    answersGenerated: number
    answersDelivered: number
    answersFailed: number
    fallbacksDelivered: number
  }
  latency: {
    sampleSize: number
    averageMs: number
    p95Ms: number
  }
  citations: {
    sampleSize: number
    averageIncluded: number
    averageRetrieved: number
  }
  rateLimits: {
    tooFast: number
    windowLimit: number
  }
  mapCleanup: {
    runCount: number
    totalRemoved: number
    lastSizeBefore: number
    lastSizeAfter: number
  }
}

const EVENT_ORDER: SupportMetricEvent[] = [
  "REQUEST_RECEIVED",
  "REQUEST_REJECTED",
  "REQUEST_RATE_LIMITED",
  "ANSWER_GENERATED",
  "ANSWER_SKIPPED",
  "ANSWER_DELIVERED",
  "ANSWER_FAILED",
  "FALLBACK_DELIVERED",
  "RATE_LIMIT_MAP_CLEANUP",
]

const MAX_LATENCY_SAMPLES = 4000

let startedAtMs = Date.now()
let lastEventAtMs: number | null = null

const counters: SupportEventCounters = {
  REQUEST_RECEIVED: 0,
  REQUEST_REJECTED: 0,
  REQUEST_RATE_LIMITED: 0,
  ANSWER_GENERATED: 0,
  ANSWER_SKIPPED: 0,
  ANSWER_DELIVERED: 0,
  ANSWER_FAILED: 0,
  FALLBACK_DELIVERED: 0,
  RATE_LIMIT_MAP_CLEANUP: 0,
}

let latencySamples: number[] = []
let totalLatencyMs = 0
let latencySampleCount = 0

let totalCitationsIncluded = 0
let totalCitationsRetrieved = 0
let citationSampleCount = 0

let rateLimitTooFast = 0
let rateLimitWindowLimit = 0

let cleanupTotalRemoved = 0
let cleanupLastSizeBefore = 0
let cleanupLastSizeAfter = 0

export function recordSupportMetric(
  event: SupportMetricEvent,
  payload: Record<string, unknown>,
): void {
  counters[event] += 1
  lastEventAtMs = Date.now()

  switch (event) {
    case "REQUEST_RATE_LIMITED": {
      const reason = readString(payload, "reason")
      if (reason === "TOO_FAST") {
        rateLimitTooFast += 1
      }
      if (reason === "WINDOW_LIMIT") {
        rateLimitWindowLimit += 1
      }
      break
    }

    case "ANSWER_GENERATED": {
      const latencyMs = readNumber(payload, "latencyMs")
      if (latencyMs != null && latencyMs >= 0) {
        totalLatencyMs += latencyMs
        latencySampleCount += 1
        latencySamples.push(latencyMs)
        if (latencySamples.length > MAX_LATENCY_SAMPLES) {
          latencySamples = latencySamples.slice(
            latencySamples.length - MAX_LATENCY_SAMPLES,
          )
        }
      }

      const citationsIncluded = readNumber(payload, "citationsIncluded")
      const citationsRetrieved = readNumber(payload, "citationsRetrieved")
      if (citationsIncluded != null && citationsRetrieved != null) {
        totalCitationsIncluded += citationsIncluded
        totalCitationsRetrieved += citationsRetrieved
        citationSampleCount += 1
      }
      break
    }

    case "RATE_LIMIT_MAP_CLEANUP": {
      const removedCount = readNumber(payload, "removedCount")
      const sizeBefore = readNumber(payload, "sizeBefore")
      const sizeAfter = readNumber(payload, "sizeAfter")

      if (removedCount != null) {
        cleanupTotalRemoved += removedCount
      }
      if (sizeBefore != null) {
        cleanupLastSizeBefore = sizeBefore
      }
      if (sizeAfter != null) {
        cleanupLastSizeAfter = sizeAfter
      }
      break
    }

    default:
      break
  }
}

export function getSupportMetricsSnapshot(): SupportMetricsSnapshot {
  const now = Date.now()

  const averageLatencyMs =
    latencySampleCount > 0 ? totalLatencyMs / latencySampleCount : 0

  const averageIncluded =
    citationSampleCount > 0 ? totalCitationsIncluded / citationSampleCount : 0

  const averageRetrieved =
    citationSampleCount > 0 ? totalCitationsRetrieved / citationSampleCount : 0

  return {
    generatedAt: new Date(now).toISOString(),
    startedAt: new Date(startedAtMs).toISOString(),
    uptimeSeconds: Math.max(0, Math.floor((now - startedAtMs) / 1000)),
    lastEventAt:
      lastEventAtMs == null ? null : new Date(lastEventAtMs).toISOString(),
    counters: EVENT_ORDER.map((event) => ({ event, count: counters[event] })),
    totals: {
      requests: counters.REQUEST_RECEIVED,
      rejected: counters.REQUEST_REJECTED,
      rateLimited: counters.REQUEST_RATE_LIMITED,
      answersGenerated: counters.ANSWER_GENERATED,
      answersDelivered: counters.ANSWER_DELIVERED,
      answersFailed: counters.ANSWER_FAILED,
      fallbacksDelivered: counters.FALLBACK_DELIVERED,
    },
    latency: {
      sampleSize: latencySampleCount,
      averageMs: round2(averageLatencyMs),
      p95Ms: round2(percentile(latencySamples, 95)),
    },
    citations: {
      sampleSize: citationSampleCount,
      averageIncluded: round2(averageIncluded),
      averageRetrieved: round2(averageRetrieved),
    },
    rateLimits: {
      tooFast: rateLimitTooFast,
      windowLimit: rateLimitWindowLimit,
    },
    mapCleanup: {
      runCount: counters.RATE_LIMIT_MAP_CLEANUP,
      totalRemoved: cleanupTotalRemoved,
      lastSizeBefore: cleanupLastSizeBefore,
      lastSizeAfter: cleanupLastSizeAfter,
    },
  }
}

/** Exported for tests */
export function _resetSupportMetricsForTest(): void {
  startedAtMs = Date.now()
  lastEventAtMs = null

  counters.REQUEST_RECEIVED = 0
  counters.REQUEST_REJECTED = 0
  counters.REQUEST_RATE_LIMITED = 0
  counters.ANSWER_GENERATED = 0
  counters.ANSWER_SKIPPED = 0
  counters.ANSWER_DELIVERED = 0
  counters.ANSWER_FAILED = 0
  counters.FALLBACK_DELIVERED = 0
  counters.RATE_LIMIT_MAP_CLEANUP = 0

  latencySamples = []
  totalLatencyMs = 0
  latencySampleCount = 0

  totalCitationsIncluded = 0
  totalCitationsRetrieved = 0
  citationSampleCount = 0

  rateLimitTooFast = 0
  rateLimitWindowLimit = 0

  cleanupTotalRemoved = 0
  cleanupLastSizeBefore = 0
  cleanupLastSizeAfter = 0
}

function readNumber(
  payload: Record<string, unknown>,
  key: string,
): number | null {
  const value = payload[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key]
  return typeof value === "string" ? value : null
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  const safeIndex = Math.max(0, Math.min(sorted.length - 1, rank))
  return sorted[safeIndex]
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
