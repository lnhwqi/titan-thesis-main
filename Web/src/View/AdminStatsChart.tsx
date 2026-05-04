import { JSX } from "react"
import { css } from "@emotion/css"
import {
  BarChart,
  Bar,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { color, font, theme, bp } from "../View/Theme"
import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import * as StatsApi from "../Api/Auth/Admin/Stats"
import * as SupportAIMetricsApi from "../Api/Auth/Admin/SupportAIMetrics"
import * as SupportAIMetricsHistoryApi from "../Api/Auth/Admin/SupportAIMetricsHistory"
import type { DashboardAnalyticsTab } from "../State/AdminDashboard"

export type Props = {
  activeTab: DashboardAnalyticsTab
  onSelectTab: (tab: DashboardAnalyticsTab) => void
  statsResponse: RD.RemoteData<ApiError<StatsApi.ErrorCode>, StatsApi.Payload>
  supportMetricsResponse: RD.RemoteData<
    ApiError<SupportAIMetricsApi.ErrorCode>,
    SupportAIMetricsApi.Payload
  >
  supportMetricsHistoryResponse: RD.RemoteData<
    ApiError<SupportAIMetricsHistoryApi.ErrorCode>,
    SupportAIMetricsHistoryApi.Payload
  >
}

export default function AdminStatsChart(_props: Props): JSX.Element {
  const {
    activeTab,
    onSelectTab,
    statsResponse,
    supportMetricsResponse,
    supportMetricsHistoryResponse,
  } = _props

  const tabs: Array<{ key: DashboardAnalyticsTab; title: string }> = [
    { key: "UserGrowth", title: "User Growth" },
    { key: "SellerGrowth", title: "Seller Growth" },
    { key: "SupportTrends", title: "Support Trends" },
  ]

  // Shared axis styling for professional look
  const axisProps = {
    tick: { fill: color.neutral600, fontSize: 12 },
    axisLine: { stroke: color.neutral300 },
    tickLine: { stroke: color.neutral300 },
  }

  const statsUnavailable =
    statsResponse._t === "Loading" ||
    statsResponse._t === "NotAsked" ||
    statsResponse._t === "Failure"

  const stats = statsResponse._t === "Success" ? statsResponse.data : null

  const userData =
    stats == null
      ? []
      : [
          {
            name: "Total",
            count: stats.totalUsers.unwrap(),
          },
          {
            name: "New (7d)",
            count: stats.newUsers.unwrap(),
          },
        ]

  const sellerData =
    stats == null
      ? []
      : [
          {
            name: "Total",
            count: stats.totalSellers.unwrap(),
          },
          {
            name: "New (7d)",
            count: stats.newSellers.unwrap(),
          },
        ]

  const financialData =
    stats == null
      ? []
      : stats.dailyFinancialData.map((day) => ({
          date: day.date,
          deposited: day.totalDeposited.unwrap(),
          used: day.totalUsed.unwrap(),
          remaining: day.remaining.unwrap(),
        }))

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Dashboard Analytics</h2>

      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={
              activeTab === tab.key
                ? `${styles.tabButton} ${styles.tabButtonActive}`
                : styles.tabButton
            }
            onClick={() => onSelectTab(tab.key)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <section className={styles.tabPanel}>
        {activeTab === "UserGrowth" ? (
          <>
            {statsUnavailable || stats == null ? (
              <div className={styles.infoMeta}>Loading user growth data...</div>
            ) : (
              <>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Users</div>
                    <div className={styles.statValue}>
                      {stats.totalUsers.unwrap().toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>New Users (7D)</div>
                    <div className={styles.statValue}>
                      {stats.newUsers.unwrap().toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={styles.chartCardFull}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>User Growth Trend</h3>
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <BarChart
                      data={userData}
                      margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={color.neutral200}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        {...axisProps}
                      />
                      <YAxis {...axisProps} />
                      <Tooltip
                        cursor={{ fill: color.neutral50 }}
                        contentStyle={{
                          backgroundColor: color.neutral0,
                          border: `1px solid ${color.genz.purple200}`,
                          borderRadius: theme.s2,
                          ...font.regular14,
                          boxShadow: theme.elevation.medium,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill={color.genz.pinkLight}
                        radius={[6, 6, 0, 0]}
                        barSize={52}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        ) : null}

        {activeTab === "SellerGrowth" ? (
          <>
            {statsUnavailable || stats == null ? (
              <div className={styles.infoMeta}>
                Loading seller growth data...
              </div>
            ) : (
              <>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Sellers</div>
                    <div className={styles.statValue}>
                      {stats.totalSellers.unwrap().toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>New Sellers (7D)</div>
                    <div className={styles.statValue}>
                      {stats.newSellers.unwrap().toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={styles.chartCardFull}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Seller Growth Trend</h3>
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <BarChart
                      data={sellerData}
                      margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={color.neutral200}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        {...axisProps}
                      />
                      <YAxis {...axisProps} />
                      <Tooltip
                        cursor={{ fill: color.neutral50 }}
                        contentStyle={{
                          backgroundColor: color.neutral0,
                          border: `1px solid ${color.genz.purple200}`,
                          borderRadius: theme.s2,
                          ...font.regular14,
                          boxShadow: theme.elevation.medium,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill={color.genz.purpleLight}
                        radius={[6, 6, 0, 0]}
                        barSize={52}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        ) : null}

        {activeTab === "SupportTrends" ? (
          <>
            {statsUnavailable ? (
              <div className={styles.infoMeta}>
                Loading financial overview...
              </div>
            ) : (
              <div className={styles.chartCardFull}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Financial Overview</h3>
                </div>
                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <LineChart
                    data={financialData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={color.neutral200}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      {...axisProps}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis {...axisProps} />
                    <Tooltip
                      cursor={{ stroke: color.genz.purple300, strokeWidth: 2 }}
                      contentStyle={{
                        backgroundColor: color.neutral0,
                        border: `1px solid ${color.genz.purple200}`,
                        borderRadius: theme.s2,
                        ...font.regular14,
                        boxShadow: theme.elevation.medium,
                      }}
                      formatter={(value) =>
                        `₫${Number(value).toLocaleString()}`
                      }
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: theme.s3,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deposited"
                      stroke={color.genz.pink}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      name="Total Deposited"
                    />
                    <Line
                      type="monotone"
                      dataKey="used"
                      stroke={color.genz.purple}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      name="Total Used"
                    />
                    <Line
                      type="monotone"
                      dataKey="remaining"
                      stroke={color.semantics.success.green500}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      name="Remaining"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {renderSupportMetrics(
              supportMetricsResponse,
              supportMetricsHistoryResponse,
            )}
          </>
        ) : null}
      </section>
    </div>
  )
}

function renderSupportMetrics(
  supportMetricsResponse: RD.RemoteData<
    ApiError<SupportAIMetricsApi.ErrorCode>,
    SupportAIMetricsApi.Payload
  >,
  supportMetricsHistoryResponse: RD.RemoteData<
    ApiError<SupportAIMetricsHistoryApi.ErrorCode>,
    SupportAIMetricsHistoryApi.Payload
  >,
): JSX.Element {
  if (
    supportMetricsResponse._t === "Loading" ||
    supportMetricsResponse._t === "NotAsked" ||
    supportMetricsHistoryResponse._t === "Loading" ||
    supportMetricsHistoryResponse._t === "NotAsked"
  ) {
    return <div className={styles.infoMeta}>Loading support AI metrics...</div>
  }

  if (
    supportMetricsResponse._t === "Failure" ||
    supportMetricsHistoryResponse._t === "Failure"
  ) {
    return (
      <div className={styles.infoMetaError}>
        Failed to load support AI monitoring data.
      </div>
    )
  }

  const current = supportMetricsResponse.data
  const history = supportMetricsHistoryResponse.data.items

  const trendData = [...history].reverse().map((item, index) => ({
    label: toHistoryLabel(item.generatedAt, index),
    requests: item.snapshot.totals.requests,
    delivered: item.snapshot.totals.answersDelivered,
    failed: item.snapshot.totals.answersFailed,
    rateLimited: item.snapshot.totals.rateLimited,
    latencyMs: item.snapshot.latency.averageMs,
  }))

  return (
    <>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Requests</div>
          <div className={styles.statValue}>
            {current.totals.requests.toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Answers Delivered</div>
          <div className={styles.statValue}>
            {current.totals.answersDelivered.toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Rate Limited</div>
          <div className={styles.statValue}>
            {current.totals.rateLimited.toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Average Latency</div>
          <div className={styles.statValue}>
            {current.latency.averageMs.toLocaleString()} ms
          </div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            Support Trend - Recent Snapshots
          </h3>
        </div>

        {trendData.length === 0 ? (
          <div className={styles.infoMeta}>
            No persisted support snapshots yet.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
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
              <Area
                type="monotone"
                dataKey="requests"
                stroke={color.semantics.success.green500}
                fill={color.semantics.success.green50}
                fillOpacity={0.45}
                strokeWidth={2}
                name="Requests (Area)"
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
                name="Rate Limited"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
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

const styles = {
  container: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
    marginBottom: theme.s4,
    color: color.neutral900,
  }),
  tabBar: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    marginBottom: theme.s4,
    borderBottom: `1px solid ${color.genz.purple100}`,
    paddingBottom: theme.s2,
  }),
  tabButton: css({
    border: `1px solid ${color.genz.purple100}`,
    background: color.neutral10,
    color: color.neutral700,
    borderRadius: `${theme.s2} ${theme.s2} 0 0`,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.18s ease",
  }),
  tabButtonActive: css({
    background: color.neutral0,
    color: color.genz.purple,
    borderColor: color.genz.purple300,
    boxShadow: `0 -2px 0 0 ${color.genz.purple} inset`,
  }),
  tabPanel: css({
    background: color.neutral50,
    border: `1px solid ${color.neutral100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
  }),
  statsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    marginBottom: theme.s5,
    ...bp.sm({
      gridTemplateColumns: "repeat(2, 1fr)",
    }),
    ...bp.lg({
      gridTemplateColumns: "repeat(4, 1fr)",
    }),
  }),
  statCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  }),
  statLabel: css({
    ...font.medium12,
    color: color.neutral600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  statValue: css({
    ...font.boldH3_29,
    color: color.neutral900,
    margin: 0,
  }),
  chartsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s4,
    ...bp.lg({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  chartCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  }),
  chartCardFull: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    width: "100%",
  }),
  chartHeader: css({
    marginBottom: theme.s4,
    paddingBottom: theme.s3,
    borderBottom: `1px solid ${color.neutral100}`,
  }),
  chartTitle: css({
    ...font.bold17,
    margin: 0,
    color: color.neutral800,
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
  financialChartCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    marginTop: theme.s4,
  }),
  sectionDivider: css({
    marginTop: theme.s6,
    marginBottom: theme.s4,
    borderTop: `1px solid ${color.neutral200}`,
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    margin: 0,
    marginBottom: theme.s4,
    color: color.neutral900,
  }),
}
