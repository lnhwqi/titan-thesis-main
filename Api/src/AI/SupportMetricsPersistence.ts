import {
  deleteOlderThan,
  insertSnapshot,
} from "../Database/AISupportMetricsSnapshotRow"
import * as Logger from "../Logger"
import {
  getSupportMetricsSnapshot,
  type SupportMetricsSnapshot,
} from "./SupportMetrics"

const EXPORT_INTERVAL_MS = 60 * 1000
const RETENTION_DAYS = 14
const MISSING_TABLE_TOKEN = "ai_support_metrics_snapshot"

let exportTimer: NodeJS.Timeout | null = null
let exportInFlight = false
let persistenceDisabled = false
let lastPersistedEventAt: string | null = null

export function startSupportMetricsPersistence(): void {
  if (exportTimer != null || persistenceDisabled) {
    return
  }

  exportTimer = setInterval(() => {
    void persistSupportMetricsSnapshot()
  }, EXPORT_INTERVAL_MS)

  void persistSupportMetricsSnapshot()
}

export function stopSupportMetricsPersistence(): void {
  if (exportTimer == null) {
    return
  }

  clearInterval(exportTimer)
  exportTimer = null
}

export async function persistSupportMetricsSnapshot(): Promise<void> {
  if (persistenceDisabled || exportInFlight) {
    return
  }

  const snapshot = getSupportMetricsSnapshot()
  if (!shouldPersistSnapshot(snapshot)) {
    return
  }

  exportInFlight = true

  try {
    await insertSnapshot(snapshot)
    lastPersistedEventAt = snapshot.lastEventAt

    const deletedCount = await deleteOlderThan(retentionCutoffDate())

    Logger.log({
      _t: "SUPPORT_AI_METRIC_SNAPSHOT_PERSISTED",
      generatedAt: snapshot.generatedAt,
      lastEventAt: snapshot.lastEventAt,
      deletedCount,
    })
  } catch (e) {
    if (isMissingTableError(e)) {
      persistenceDisabled = true
      Logger.warn(
        "Support metrics persistence disabled because ai_support_metrics_snapshot table is missing. Run db:migrate to enable it.",
      )
      return
    }

    Logger.error(`#supportMetricsPersistence.persist error: ${e}`)
  } finally {
    exportInFlight = false
  }
}

function shouldPersistSnapshot(snapshot: SupportMetricsSnapshot): boolean {
  if (snapshot.lastEventAt == null) {
    return false
  }

  if (snapshot.lastEventAt === lastPersistedEventAt) {
    return false
  }

  const totalEventCount = snapshot.counters.reduce((total, counter) => {
    return total + counter.count
  }, 0)

  return totalEventCount > 0
}

function retentionCutoffDate(): Date {
  return new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

function isMissingTableError(error: unknown): boolean {
  const text = String(error)
  return text.includes(MISSING_TABLE_TOKEN) && text.includes("does not exist")
}

/** Exported for tests */
export function _resetSupportMetricsPersistenceForTest(): void {
  stopSupportMetricsPersistence()
  exportInFlight = false
  persistenceDisabled = false
  lastPersistedEventAt = null
}
