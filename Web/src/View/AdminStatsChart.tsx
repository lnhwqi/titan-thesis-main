import { JSX } from "react"
import { css } from "@emotion/css"
import {
  BarChart,
  Bar,
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

export type Props = {
  statsResponse: RD.RemoteData<ApiError<StatsApi.ErrorCode>, StatsApi.Payload>
}

export default function AdminStatsChart(_props: Props): JSX.Element {
  const { statsResponse } = _props

  if (statsResponse._t === "Loading" || statsResponse._t === "NotAsked") {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Dashboard Analytics</h2>
        <div className={styles.infoMeta}>Loading analytics data...</div>
      </div>
    )
  }

  if (statsResponse._t === "Failure") {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Dashboard Analytics</h2>
        <div className={styles.infoMetaError}>
          Failed to load analytics data.
        </div>
      </div>
    )
  }

  const stats = statsResponse.data

  // Prepare data for charts
  const userData = [
    {
      name: "Total",
      count: stats.totalUsers.unwrap(),
    },
    {
      name: "New (7d)",
      count: stats.newUsers.unwrap(),
    },
  ]

  const sellerData = [
    {
      name: "Total",
      count: stats.totalSellers.unwrap(),
    },
    {
      name: "New (7d)",
      count: stats.newSellers.unwrap(),
    },
  ]

  // Prepare daily financial data for line chart (last 30 days)
  const financialData = stats.dailyFinancialData.map((day) => ({
    date: day.date,
    deposited: day.totalDeposited.unwrap(),
    used: day.totalUsed.unwrap(),
    remaining: day.remaining.unwrap(),
  }))

  // Shared axis styling for professional look
  const axisProps = {
    tick: { fill: color.neutral600, fontSize: 12 },
    axisLine: { stroke: color.neutral300 },
    tickLine: { stroke: color.neutral300 },
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Dashboard Analytics</h2>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Users</div>
          <div className={styles.statValue}>
            {stats.totalUsers.unwrap().toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>New Users (7d)</div>
          <div className={styles.statValue}>
            {stats.newUsers.unwrap().toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Sellers</div>
          <div className={styles.statValue}>
            {stats.totalSellers.unwrap().toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>New Sellers (7d)</div>
          <div className={styles.statValue}>
            {stats.newSellers.unwrap().toLocaleString()}
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>User Growth</h3>
          </div>
          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <BarChart
              data={userData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  border: `1px solid ${color.secondary200}`,
                  borderRadius: theme.s2,
                  ...font.regular14,
                  boxShadow: theme.elevation.medium,
                }}
              />
              <Bar
                dataKey="count"
                fill={color.primary400}
                radius={[4, 4, 0, 0]}
                barSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Seller Growth</h3>
          </div>
          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <BarChart
              data={sellerData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  border: `1px solid ${color.secondary200}`,
                  borderRadius: theme.s2,
                  ...font.regular14,
                  boxShadow: theme.elevation.medium,
                }}
              />
              <Bar
                dataKey="count"
                fill={color.secondary400}
                radius={[4, 4, 0, 0]}
                barSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.financialChartCard}>
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
              cursor={{ stroke: color.secondary300, strokeWidth: 2 }}
              contentStyle={{
                backgroundColor: color.neutral0,
                border: `1px solid ${color.secondary200}`,
                borderRadius: theme.s2,
                ...font.regular14,
                boxShadow: theme.elevation.medium,
              }}
              formatter={(value) => `₫${Number(value).toLocaleString()}`}
            />
            <Legend
              wrapperStyle={{
                paddingTop: theme.s3,
              }}
            />
            <Line
              type="monotone"
              dataKey="deposited"
              stroke={color.primary500}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Total Deposited"
            />
            <Line
              type="monotone"
              dataKey="used"
              stroke={color.secondary500}
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
    </div>
  )
}

const styles = {
  container: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
    marginBottom: theme.s5,
    color: color.neutral900,
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
    border: `1px solid ${color.secondary200}`,
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
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
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
    border: `1px dashed ${color.secondary200}`,
  }),
  infoMetaError: css({
    ...font.regular14,
    color: color.semantics.error.red500,
    padding: theme.s6,
    textAlign: "center",
    background: color.semantics.error.red50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.secondary200}`,
  }),
  financialChartCard: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    marginTop: theme.s4,
  }),
}
