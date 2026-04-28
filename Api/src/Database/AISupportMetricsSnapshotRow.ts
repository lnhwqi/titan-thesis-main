import { randomUUID } from "node:crypto"
import {
  payloadDecoder,
  type Payload as SupportMetricsPayload,
} from "../../../Core/Api/Auth/Admin/SupportAIMetrics"
import type { SupportMetricsSnapshot } from "../AI/SupportMetrics"
import db, { type AISupportMetricsSnapshotTable } from "../Database"
import * as Logger from "../Logger"

const table = "ai_support_metrics_snapshot"
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export type PersistedSupportMetricsSnapshot = {
  id: string
  generatedAt: string
  lastEventAt: string | null
  createdAt: string
  snapshot: SupportMetricsPayload
}

export async function insertSnapshot(
  snapshot: SupportMetricsSnapshot,
): Promise<void> {
  const now = new Date()
  const generatedAt = parseISODate(snapshot.generatedAt, now)
  const lastEventAt =
    snapshot.lastEventAt == null
      ? null
      : parseISODate(snapshot.lastEventAt, now)

  await db
    .insertInto(table)
    .values({
      id: randomUUID(),
      generatedAt,
      lastEventAt,
      snapshot: toSnapshotRecord(snapshot),
      createdAt: now,
    })
    .execute()
    .then(() => undefined)
    .catch((e) => {
      Logger.error(`#${table}.insertSnapshot error: ${e}`)
      throw e
    })
}

export async function listRecentSnapshots(
  limit: number,
): Promise<PersistedSupportMetricsSnapshot[]> {
  const safeLimit = normalizeLimit(limit)

  const rows = await db
    .selectFrom(table)
    .selectAll()
    .orderBy("generatedAt", "desc")
    .limit(safeLimit)
    .execute()
    .catch((e) => {
      Logger.error(`#${table}.listRecentSnapshots error: ${e}`)
      throw e
    })

  const snapshots: PersistedSupportMetricsSnapshot[] = []

  rows.forEach((row) => {
    const parsed = toPersistedSnapshot(row)
    if (parsed != null) {
      snapshots.push(parsed)
    }
  })

  return snapshots
}

export async function deleteOlderThan(cutoff: Date): Promise<number> {
  const result = await db
    .deleteFrom(table)
    .where("generatedAt", "<", cutoff)
    .executeTakeFirst()
    .catch((e) => {
      Logger.error(`#${table}.deleteOlderThan error: ${e}`)
      throw e
    })

  return normalizeDeletedCount(result?.numDeletedRows)
}

function toPersistedSnapshot(
  row: AISupportMetricsSnapshotTable,
): PersistedSupportMetricsSnapshot | null {
  try {
    const decoded = payloadDecoder.verify(row.snapshot)

    return {
      id: row.id,
      generatedAt: row.generatedAt.toISOString(),
      lastEventAt:
        row.lastEventAt == null ? null : row.lastEventAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      snapshot: decoded,
    }
  } catch (e) {
    Logger.warn(`#${table}.toPersistedSnapshot skipped row ${row.id}: ${e}`)
    return null
  }
}

function toSnapshotRecord(
  snapshot: SupportMetricsSnapshot,
): Record<string, unknown> {
  return {
    generatedAt: snapshot.generatedAt,
    startedAt: snapshot.startedAt,
    uptimeSeconds: snapshot.uptimeSeconds,
    lastEventAt: snapshot.lastEventAt,
    counters: snapshot.counters,
    totals: snapshot.totals,
    latency: snapshot.latency,
    citations: snapshot.citations,
    rateLimits: snapshot.rateLimits,
    mapCleanup: snapshot.mapCleanup,
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT
  }

  const rounded = Math.floor(limit)
  if (rounded < 1) {
    return 1
  }

  if (rounded > MAX_LIMIT) {
    return MAX_LIMIT
  }

  return rounded
}

function parseISODate(value: string, fallback: Date): Date {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function normalizeDeletedCount(value: unknown): number {
  if (typeof value === "bigint") {
    return Number(value)
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  return 0
}
