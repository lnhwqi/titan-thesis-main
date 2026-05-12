import { JSX } from "react"
import { css } from "@emotion/css"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import * as RD from "../../../Core/Data/RemoteData"
import { State } from "../State"
import { ApiError } from "../Api"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { color, font, theme, bp } from "../View/Theme"
import * as AdminDashboardAction from "../Action/Admin"
import * as SupportAIMetricsApi from "../Api/Auth/Admin/SupportAIMetrics"
import * as SupportAIMetricsHistoryApi from "../Api/Auth/Admin/SupportAIMetricsHistory"

type Props = { state: State }

type SupportMonitoringRange = State["adminDashboard"]["supportMonitoringRange"]
type SupportMonitoringLimit =
  State["adminDashboard"]["supportMonitoringHistoryLimit"]
type SnapshotItem = SupportAIMetricsHistoryApi.Payload["items"][number]

type CurrentMetricsResponse = RD.RemoteData<
  ApiError<SupportAIMetricsApi.ErrorCode>,
  SupportAIMetricsApi.Payload
>

type HistoryResponse = RD.RemoteData<
  ApiError<SupportAIMetricsHistoryApi.ErrorCode>,
  SupportAIMetricsHistoryApi.Payload
>

export default function AdminSupportMonitoringPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to monitor support AI performance.
          </p>
        </div>
      </div>
    )
  }

  const supportMetricsResponse = state.adminDashboard.supportMetricsResponse
  const supportMetricsHistoryResponse =
    state.adminDashboard.supportMetricsHistoryResponse
  const selectedRange = state.adminDashboard.supportMonitoringRange
  const selectedLimit = state.adminDashboard.supportMonitoringHistoryLimit

  const filteredHistory = filterHistoryByRange(
    supportMetricsHistoryResponse,
    selectedRange,
  )

  const currentMetrics =
    supportMetricsResponse._t === "Success" ? supportMetricsResponse.data : null

  const canExport = currentMetrics != null && filteredHistory.length > 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Support AI Monitoring</h1>
          <p className={styles.subtitle}>
            Analyze support load, answer quality trends, and rate-limit
            pressure.
          </p>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(AdminDashboardAction.goToAdminDashboard())}
        >
          Back to dashboard
        </button>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.sectionTitle}>Filters and actions</h2>
        </div>

        <div className={styles.controlGrid}>
          <label className={styles.controlField}>
            <span className={styles.controlLabel}>Time range</span>
            <select
              className={styles.select}
              value={selectedRange}
              onChange={(event) =>
                emit(
                  AdminDashboardAction.onChangeSupportMonitoringRange(
                    parseSupportMonitoringRange(event.currentTarget.value),
                  ),
                )
              }
            >
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="all">All snapshots</option>
            </select>
          </label>

          <label className={styles.controlField}>
            <span className={styles.controlLabel}>Snapshot fetch limit</span>
            <select
              className={styles.select}
              value={String(selectedLimit)}
              onChange={(event) =>
                emit(
                  AdminDashboardAction.onChangeSupportMonitoringHistoryLimit(
                    parseSupportMonitoringLimit(event.currentTarget.value),
                  ),
                )
              }
            >
              <option value="60">60 snapshots</option>
              <option value="120">120 snapshots</option>
              <option value="200">200 snapshots</option>
            </select>
          </label>

          <div className={styles.buttonRow}>
            <button
              className={styles.secondaryButton}
              onClick={() =>
                emit(AdminDashboardAction.reloadSupportMonitoringData())
              }
            >
              Refresh metrics
            </button>
            <button
              className={styles.primaryButton}
              disabled={!canExport}
              onClick={() => {
                if (currentMetrics == null) {
                  return
                }

                exportSupportMonitoringCsv(currentMetrics, filteredHistory)
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Current snapshot</h2>
        {renderCurrentMetrics(supportMetricsResponse)}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Historical trends</h2>
        <p className={styles.metaText}>
          Showing {filteredHistory.length} snapshot(s) in range.
        </p>
        {renderTrendChart(supportMetricsHistoryResponse, filteredHistory)}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Recent snapshots</h2>
        {renderSnapshotTable(supportMetricsHistoryResponse, filteredHistory)}
      </section>
    </div>
  )
}

function renderCurrentMetrics(response: CurrentMetricsResponse): JSX.Element {
  switch (response._t) {
    case "NotAsked":
      return <div className={styles.infoMeta}>Metrics are not loaded yet.</div>
    case "Loading":
      return <div className={styles.infoMeta}>Loading current metrics...</div>
    case "Failure":
      return (
        <div className={styles.infoMetaError}>
          Unable to load current support metrics.
        </div>
      )
    case "Success": {
      const metrics = response.data
      const deliveryRate = toPercent(
        metrics.totals.answersDelivered,
        metrics.totals.requests,
      )

      return (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Requests</div>
            <div className={styles.statValue}>
              {metrics.totals.requests.toLocaleString()}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Delivered</div>
            <div className={styles.statValue}>
              {metrics.totals.answersDelivered.toLocaleString()}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Failed</div>
            <div className={styles.statValue}>
              {metrics.totals.answersFailed.toLocaleString()}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Rate limited</div>
            <div className={styles.statValue}>
              {metrics.totals.rateLimited.toLocaleString()}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Delivery rate</div>
            <div className={styles.statValue}>{deliveryRate}%</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg latency</div>
            <div className={styles.statValue}>
              {metrics.latency.averageMs.toLocaleString()} ms
            </div>
          </div>
        </div>
      )
    }
  }
}

function renderTrendChart(
  response: HistoryResponse,
  filteredHistory: SnapshotItem[],
): JSX.Element {
  if (response._t === "NotAsked") {
    return <div className={styles.infoMeta}>History is not loaded yet.</div>
  }

  if (response._t === "Loading") {
    return <div className={styles.infoMeta}>Loading support history...</div>
  }

  if (response._t === "Failure") {
    return (
      <div className={styles.infoMetaError}>
        Unable to load support history.
      </div>
    )
  }

  if (filteredHistory.length === 0) {
    return (
      <div className={styles.infoMeta}>
        No snapshots match the selected range.
      </div>
    )
  }

  const trendData = filteredHistory
    .toSorted((a, b) => toTimestamp(a.generatedAt) - toTimestamp(b.generatedAt))
    .map((item, index) => ({
      label: toHistoryLabel(item.generatedAt, index),
      requests: item.snapshot.totals.requests,
      delivered: item.snapshot.totals.answersDelivered,
      failed: item.snapshot.totals.answersFailed,
      rateLimited: item.snapshot.totals.rateLimited,
    }))

  return (
    <div className={styles.chartCard}>
      <ResponsiveContainer
        width="100%"
        height={320}
      >
        <LineChart
          data={trendData}
          margin={{ top: 12, right: 20, left: 0, bottom: 50 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={color.neutral200}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: color.neutral600, fontSize: 12 }}
            axisLine={{ stroke: color.neutral300 }}
            tickLine={{ stroke: color.neutral300 }}
            angle={-25}
            textAnchor="end"
            height={65}
          />
          <YAxis
            tick={{ fill: color.neutral600, fontSize: 12 }}
            axisLine={{ stroke: color.neutral300 }}
            tickLine={{ stroke: color.neutral300 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: color.neutral0,
              border: `1px solid ${color.genz.purple200}`,
              borderRadius: theme.s2,
              ...font.regular14,
              boxShadow: theme.elevation.medium,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="requests"
            stroke={color.genz.purple}
            strokeWidth={2}
            dot={false}
            name="Requests"
          />
          <Line
            type="monotone"
            dataKey="delivered"
            stroke={color.semantics.success.green500}
            strokeWidth={2}
            dot={false}
            name="Delivered"
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke={color.semantics.error.red500}
            strokeWidth={2}
            dot={false}
            name="Failed"
          />
          <Line
            type="monotone"
            dataKey="rateLimited"
            stroke={color.genz.pink}
            strokeWidth={2}
            dot={false}
            name="Rate limited"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderSnapshotTable(
  response: HistoryResponse,
  filteredHistory: SnapshotItem[],
): JSX.Element {
  if (response._t === "NotAsked") {
    return <div className={styles.infoMeta}>History is not loaded yet.</div>
  }

  if (response._t === "Loading") {
    return <div className={styles.infoMeta}>Loading support history...</div>
  }

  if (response._t === "Failure") {
    return (
      <div className={styles.infoMetaError}>
        Unable to load support history.
      </div>
    )
  }

  if (filteredHistory.length === 0) {
    return (
      <div className={styles.infoMeta}>
        No snapshots available for the selected range.
      </div>
    )
  }

  const recent = filteredHistory
    .toSorted((a, b) => toTimestamp(b.generatedAt) - toTimestamp(a.generatedAt))
    .slice(0, 12)

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Generated At</th>
            <th>Requests</th>
            <th>Delivered</th>
            <th>Failed</th>
            <th>Rate Limited</th>
            <th>Avg Latency (ms)</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((item) => (
            <tr key={item.id}>
              <td>{toReadableDate(item.generatedAt)}</td>
              <td>{item.snapshot.totals.requests.toLocaleString()}</td>
              <td>{item.snapshot.totals.answersDelivered.toLocaleString()}</td>
              <td>{item.snapshot.totals.answersFailed.toLocaleString()}</td>
              <td>{item.snapshot.totals.rateLimited.toLocaleString()}</td>
              <td>{item.snapshot.latency.averageMs.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function parseSupportMonitoringRange(value: string): SupportMonitoringRange {
  switch (value) {
    case "1h":
      return "1h"
    case "24h":
      return "24h"
    case "7d":
      return "7d"
    case "14d":
      return "14d"
    default:
      return "all"
  }
}

function parseSupportMonitoringLimit(value: string): SupportMonitoringLimit {
  switch (value) {
    case "60":
      return 60
    case "120":
      return 120
    case "200":
      return 200
    default:
      return 120
  }
}

function filterHistoryByRange(
  response: HistoryResponse,
  range: SupportMonitoringRange,
): SnapshotItem[] {
  if (response._t !== "Success") {
    return []
  }

  const sortedItems = response.data.items.toSorted(
    (a, b) => toTimestamp(b.generatedAt) - toTimestamp(a.generatedAt),
  )

  const windowMs = toWindowMilliseconds(range)

  if (windowMs == null) {
    return sortedItems
  }

  const cutoff = Date.now() - windowMs

  return sortedItems.filter((item) => toTimestamp(item.generatedAt) >= cutoff)
}

function toWindowMilliseconds(range: SupportMonitoringRange): number | null {
  switch (range) {
    case "1h":
      return 60 * 60 * 1000
    case "24h":
      return 24 * 60 * 60 * 1000
    case "7d":
      return 7 * 24 * 60 * 60 * 1000
    case "14d":
      return 14 * 24 * 60 * 60 * 1000
    case "all":
      return null
  }
}

function toTimestamp(value: string): number {
  const date = new Date(value)
  const time = date.getTime()

  if (Number.isNaN(time)) {
    return -1
  }

  return time
}

function toHistoryLabel(value: string, index: number): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return `#${index + 1}`
  }

  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")

  return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`
}

function toReadableDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function toPercent(part: number, total: number): string {
  if (total <= 0) {
    return "0.0"
  }

  return ((part / total) * 100).toFixed(1)
}

function exportSupportMonitoringCsv(
  currentMetrics: SupportAIMetricsApi.Payload,
  history: SnapshotItem[],
): void {
  const summaryHeaders = [
    "generated_at",
    "requests",
    "answers_delivered",
    "answers_failed",
    "rate_limited",
    "avg_latency_ms",
    "citations_avg_included",
    "citations_avg_retrieved",
    "last_event_at",
  ]

  const summaryRow = [
    currentMetrics.generatedAt,
    String(currentMetrics.totals.requests),
    String(currentMetrics.totals.answersDelivered),
    String(currentMetrics.totals.answersFailed),
    String(currentMetrics.totals.rateLimited),
    String(currentMetrics.latency.averageMs),
    String(currentMetrics.citations.averageIncluded),
    String(currentMetrics.citations.averageRetrieved),
    currentMetrics.lastEventAt ?? "",
  ]

  const historyHeaders = [
    "snapshot_generated_at",
    "requests",
    "answers_delivered",
    "answers_failed",
    "rate_limited",
    "avg_latency_ms",
    "last_event_at",
  ]

  const historyRows = history.map((item) => [
    item.generatedAt,
    String(item.snapshot.totals.requests),
    String(item.snapshot.totals.answersDelivered),
    String(item.snapshot.totals.answersFailed),
    String(item.snapshot.totals.rateLimited),
    String(item.snapshot.latency.averageMs),
    item.lastEventAt ?? "",
  ])

  const csvLines = [
    ["section", "current_metrics"],
    summaryHeaders,
    summaryRow,
    [""],
    ["section", "history"],
    historyHeaders,
    ...historyRows,
  ]

  const csvText = csvLines
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\n")

  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-")

  link.href = url
  link.download = `support-ai-monitoring-${timestamp}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function escapeCsv(value: string): string {
  const needsQuote =
    value.includes(",") || value.includes('"') || value.includes("\n")

  if (!needsQuote) {
    return value
  }

  return `"${value.replace(/"/g, '""')}"`
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 8% 18%, ${color.genz.purple100} 0%, transparent 35%),` +
      `radial-gradient(circle at 88% 12%, ${color.genz.purple200} 0%, transparent 32%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    marginBottom: theme.s6,
    flexWrap: "wrap",
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: 0,
    maxWidth: "720px",
  }),
  panel: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  panelHeader: css({
    marginBottom: theme.s4,
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    margin: 0,
    marginBottom: theme.s2,
    color: color.neutral900,
  }),
  metaText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: 0,
    marginBottom: theme.s4,
  }),
  controlGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s4,
    ...bp.md({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      alignItems: "end",
    }),
  }),
  controlField: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  controlLabel: css({
    ...font.medium14,
    color: color.neutral700,
  }),
  select: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    background: color.neutral0,
    color: color.neutral900,
    "&:focus": {
      outline: "none",
      borderColor: color.genz.purple,
      boxShadow: `0 0 0 2px ${color.genz.purple100}`,
    },
  }),
  buttonRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  primaryButton: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
    transition: "opacity 0.2s",
    "&:hover": {
      opacity: 0.92,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
    "&:hover": {
      background: color.neutral50,
    },
  }),
  statsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.sm({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    }),
    ...bp.lg({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    }),
  }),
  statCard: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    background: color.neutral0,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  statLabel: css({
    ...font.medium12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: color.neutral600,
  }),
  statValue: css({
    ...font.boldH3_29,
    margin: 0,
    color: color.neutral900,
  }),
  chartCard: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    background: color.neutral0,
    padding: theme.s4,
  }),
  tableWrap: css({
    width: "100%",
    overflowX: "auto",
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
  }),
  table: css({
    width: "100%",
    borderCollapse: "collapse",
    "th, td": {
      padding: `${theme.s3} ${theme.s4}`,
      borderBottom: `1px solid ${color.genz.purple100}`,
      textAlign: "left",
      whiteSpace: "nowrap",
      ...font.regular14,
      color: color.neutral800,
    },
    th: {
      ...font.medium14,
      color: color.neutral700,
      background: color.neutral50,
      borderBottom: `2px solid ${color.genz.purple200}`,
    },
    "tr:last-child td": {
      borderBottom: "none",
    },
  }),
  infoMeta: css({
    ...font.regular14,
    color: color.neutral600,
    padding: theme.s6,
    textAlign: "center",
    background: color.neutral50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.genz.purple200}`,
  }),
  infoMetaError: css({
    ...font.regular14,
    color: color.semantics.error.red500,
    padding: theme.s6,
    textAlign: "center",
    background: color.semantics.error.red50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.genz.purple200}`,
  }),
  gate: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.neutral100,
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "520px",
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.medium,
    padding: theme.s6,
  }),
  gateTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: 0,
  }),
}
