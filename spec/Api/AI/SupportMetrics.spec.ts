import {
  _resetSupportMetricsForTest,
  getSupportMetricsSnapshot,
  recordSupportMetric,
} from "../../../Api/src/AI/SupportMetrics"

describe("Api/AI/SupportMetrics", () => {
  beforeEach(() => {
    _resetSupportMetricsForTest()
  })

  test("aggregates counters, latency and citations", () => {
    recordSupportMetric("REQUEST_RECEIVED", { questionLength: 120 })
    recordSupportMetric("ANSWER_GENERATED", {
      latencyMs: 100,
      citationsRetrieved: 4,
      citationsIncluded: 3,
    })
    recordSupportMetric("ANSWER_GENERATED", {
      latencyMs: 200,
      citationsRetrieved: 2,
      citationsIncluded: 1,
    })
    recordSupportMetric("ANSWER_DELIVERED", { delivered: true })

    const snapshot = getSupportMetricsSnapshot()

    expect(snapshot.totals.requests).toBe(1)
    expect(snapshot.totals.answersGenerated).toBe(2)
    expect(snapshot.totals.answersDelivered).toBe(1)
    expect(snapshot.latency.sampleSize).toBe(2)
    expect(snapshot.latency.averageMs).toBe(150)
    expect(snapshot.citations.sampleSize).toBe(2)
    expect(snapshot.citations.averageRetrieved).toBe(3)
    expect(snapshot.citations.averageIncluded).toBe(2)
  })

  test("tracks rate-limit reasons and cleanup stats", () => {
    recordSupportMetric("REQUEST_RATE_LIMITED", {
      reason: "TOO_FAST",
      retryAfterSeconds: 2,
    })
    recordSupportMetric("REQUEST_RATE_LIMITED", {
      reason: "WINDOW_LIMIT",
      retryAfterSeconds: 20,
    })
    recordSupportMetric("RATE_LIMIT_MAP_CLEANUP", {
      removedCount: 7,
      sizeBefore: 5100,
      sizeAfter: 5093,
    })

    const snapshot = getSupportMetricsSnapshot()

    expect(snapshot.totals.rateLimited).toBe(2)
    expect(snapshot.rateLimits.tooFast).toBe(1)
    expect(snapshot.rateLimits.windowLimit).toBe(1)
    expect(snapshot.mapCleanup.runCount).toBe(1)
    expect(snapshot.mapCleanup.totalRemoved).toBe(7)
    expect(snapshot.mapCleanup.lastSizeBefore).toBe(5100)
    expect(snapshot.mapCleanup.lastSizeAfter).toBe(5093)
  })
})
