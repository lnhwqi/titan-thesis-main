import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { fadeSlideUp } from "../View/Theme/Keyframe"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import * as OrderPaymentAction from "../Action/OrderPayment"
import { navigateTo, toRoute } from "../Route"
import { OrderPayment } from "../../../Core/App/OrderPayment"
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Props = { state: State }

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PACKED: "Packed",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  RECEIVED: "Received",
  REPORTED: "Reported",
  DELIVERY_ISSUE: "Delivery Issue",
  CANCELLED: "Cancelled",
}

function formatCurrency(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`
}

function formatDate(ts: { unwrap(): number }): string {
  return new Date(ts.unwrap()).toLocaleDateString("vi-VN")
}

type OrderRow = {
  id: string
  shortId: string
  date: string
  customer: string
  status: string
  revenue: number
  fee: number
  profit: number
  margin: number
  paymentMethod: string
}

function buildRows(orders: OrderPayment[]): OrderRow[] {
  return orders.map((order) => ({
    id: order.id.unwrap(),
    shortId: order.id.unwrap().slice(0, 8),
    date: formatDate(order.createdAt),
    customer: order.username.unwrap(),
    status: order.status,
    revenue: order.price.unwrap(),
    fee: order.fee.unwrap(),
    profit: order.profit.unwrap(),
    margin:
      order.price.unwrap() > 0
        ? (order.profit.unwrap() / order.price.unwrap()) * 100
        : 0,
    paymentMethod: order.paymentMethod,
  }))
}

function exportCSV(rows: OrderRow[]): void {
  const headers = [
    "Order ID",
    "Date",
    "Customer",
    "Status",
    "Revenue (T)",
    "Fee (T)",
    "Profit (T)",
    "Margin (%)",
    "Payment Method",
  ]
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(
      [
        `"${row.id}"`,
        `"${row.date}"`,
        `"${row.customer.replace(/"/g, "'")}"`,
        `"${STATUS_LABELS[row.status] ?? row.status}"`,
        row.revenue,
        row.fee,
        row.profit,
        row.margin.toFixed(2),
        `"${row.paymentMethod}"`,
      ].join(","),
    )
  }
  const csv = "\uFEFF" + lines.join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "tracking-profit-received-orders.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function SellerShippingPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Seller Access Required</h1>
          <p className={styles.gateText}>
            Please log in as seller to view analytics.
          </p>
          <button
            className={styles.exportButton}
            style={{ alignSelf: "center" }}
            onClick={() => emit(navigateTo(toRoute("SellerLogin", {})))}
          >
            Go to Seller Login
          </button>
        </div>
      </div>
    )
  }

  const orders = state.orderPayment.sellerOrders
  const sellerWallet =
    state.sellerDashboard.profileResponse._t === "Success"
      ? state.sellerDashboard.profileResponse.data.seller.wallet.unwrap()
      : 0
  const isLoading = state.orderPayment.sellerOrdersResponse._t === "Loading"

  const receivedOrders = orders.filter((order) => order.status === "RECEIVED")

  let totalRevenue = 0
  let totalFee = 0
  let totalProfit = 0
  let completedProfit = 0
  let pendingProfit = 0
  const trendByDate: Record<
    string,
    {
      date: string
      revenue: number
      fee: number
      profit: number
      orders: number
    }
  > = {}
  const statusProfit: Record<string, number> = {}

  for (const order of receivedOrders) {
    const revenue = order.price.unwrap()
    const fee = order.fee.unwrap()
    const profit = order.profit.unwrap()
    const date = formatDate(order.createdAt)

    totalRevenue += revenue
    totalFee += fee
    totalProfit += profit
    statusProfit[order.status] = (statusProfit[order.status] ?? 0) + profit

    completedProfit += profit

    if (trendByDate[date] == null) {
      trendByDate[date] = { date, revenue: 0, fee: 0, profit: 0, orders: 0 }
    }
    trendByDate[date].revenue += revenue
    trendByDate[date].fee += fee
    trendByDate[date].profit += profit
    trendByDate[date].orders += 1
  }

  pendingProfit = orders
    .filter((order) => order.status !== "RECEIVED")
    .reduce((sum, order) => sum + order.profit.unwrap(), 0)

  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const trendData = Object.values(trendByDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)

  const statusProfitData = Object.entries(statusProfit)
    .map(([status, profit]) => ({
      name: STATUS_LABELS[status] ?? status,
      profit,
    }))
    .sort((a, b) => b.profit - a.profit)

  const rows = buildRows(receivedOrders)

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Seller Workspace</p>
          <h1 className={styles.heroTitle}>Tracking Profit</h1>
          <p className={styles.heroSubtitle}>
            Monitor realized seller profit from settled and received orders.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(OrderPaymentAction.onEnterSellerOrdersRoute())}
          >
            Refresh
          </button>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loadingBar}>Loading orders…</div>
      ) : null}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatCurrency(sellerWallet)}</div>
          <div className={styles.statLabel}>Seller Wallet Balance</div>
        </div>
        <div className={styles.statCard}>
          <div className={[styles.statValue, styles.statFee].join(" ")}>
            {formatCurrency(-totalFee)}
          </div>
          <div className={styles.statLabel}>Platform Fees</div>
        </div>
        <div className={styles.statCard}>
          <div className={[styles.statValue, styles.statRevenue].join(" ")}>
            {formatCurrency(totalProfit)}
          </div>
          <div className={styles.statLabel}>Realized Net Profit</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{margin.toFixed(1)}%</div>
          <div className={styles.statLabel}>Realized Margin</div>
        </div>
        <div className={styles.statCard}>
          <div className={[styles.statValue, styles.statRevenue].join(" ")}>
            {formatCurrency(completedProfit)}
          </div>
          <div className={styles.statLabel}>Settled Profit</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {formatCurrency(pendingProfit)}
          </div>
          <div className={styles.statLabel}>Pending Pipeline</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{receivedOrders.length}</div>
          <div className={styles.statLabel}>Received Orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{trendData.length}</div>
          <div className={styles.statLabel}>Tracked Days</div>
        </div>
      </div>

      {trendData.length > 0 ? (
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>14-Day Profit Trend</div>
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <ComposedChart
                data={trendData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={color.neutral200}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: color.neutral700 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: color.neutral700 }}
                  tickFormatter={(v) =>
                    typeof v === "number"
                      ? `T ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`
                      : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name,
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill={color.secondary100}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke={color.semantics.success.green500}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="fee"
                  name="Fee"
                  stroke={color.semantics.error.red500}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Profit by Order Status</div>
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <BarChart
                data={statusProfitData}
                margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={color.neutral200}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: color.neutral700 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: color.neutral700 }}
                  tickFormatter={(v) =>
                    typeof v === "number"
                      ? `T ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`
                      : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name,
                  ]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill={color.semantics.success.green500}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            Profit Transactions ({receivedOrders.length})
          </div>
          <button
            className={styles.exportButton}
            onClick={() => exportCSV(rows)}
            disabled={rows.length === 0}
          >
            Export Profit Report (.csv)
          </button>
        </div>

        {rows.length === 0 ? (
          <div className={styles.empty}>No orders yet.</div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Order ID</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Revenue</th>
                  <th className={styles.th}>Fee</th>
                  <th className={styles.th}>Profit</th>
                  <th className={styles.th}>Margin</th>
                  <th className={styles.th}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={styles.tr}
                  >
                    <td className={styles.td}>
                      <span className={styles.orderId}>{row.shortId}…</span>
                    </td>
                    <td className={styles.td}>{row.date}</td>
                    <td className={styles.td}>{row.customer}</td>
                    <td className={styles.td}>
                      <span className={styles.statusTag}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className={styles.td}>{formatCurrency(row.revenue)}</td>
                    <td className={[styles.td, styles.feeCell].join(" ")}>
                      -{formatCurrency(row.fee)}
                    </td>
                    <td className={[styles.td, styles.profitCell].join(" ")}>
                      {formatCurrency(row.profit)}
                    </td>
                    <td className={styles.td}>{row.margin.toFixed(1)}%</td>
                    <td className={styles.td}>{row.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.secondary10}`,
    display: "grid",
    gap: theme.s5,
    alignContent: "start",
    animation: `${fadeSlideUp} 0.4s ease both`,
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s6,
    background: `radial-gradient(circle at 10% 15%, rgba(0, 82, 156, 0.08) 0%, transparent 40%), ${color.secondary10}`,
  }),
  gateCard: css({
    maxWidth: "420px",
    background: "var(--app-surface-strong)",
    border: "1px solid var(--app-border)",
    borderRadius: theme.s4,
    boxShadow: "var(--app-shadow-lg)",
    padding: theme.s6,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    textAlign: "center",
  }),
  gateTitle: css({ ...font.boldH4_24, margin: 0, color: "var(--app-accent)" }),
  gateText: css({ ...font.regular14, margin: 0, color: color.neutral600 }),
  hero: css({
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.secondary400} 38%, ${color.primary400} 100%)`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: "0 16px 36px rgba(0, 82, 156, 0.24)",
    color: color.neutral0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s3,
    flexWrap: "wrap",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '\"\"',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.14) 0%, transparent 50%)",
      pointerEvents: "none",
    },
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: color.secondary50,
    marginBottom: theme.s1,
  }),
  heroTitle: css({ ...font.boldH4_24, margin: 0, color: color.neutral0 }),
  heroSubtitle: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.75)",
    marginTop: theme.s1,
  }),
  heroActions: css({ display: "flex", gap: theme.s2, flexWrap: "wrap" }),
  heroSecondaryButton: css({
    border: `1px solid rgba(255,255,255,0.25)`,
    background: "rgba(255,255,255,0.1)",
    color: color.neutral0,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "rgba(255,255,255,0.18)",
      transform: "translateY(-2px)",
    },
  }),
  loadingBar: css({
    ...font.regular14,
    color: color.neutral700,
    marginBottom: theme.s4,
  }),
  statsRow: css({
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: theme.s3,
    ...bp.md({
      gridTemplateColumns: "repeat(4, 1fr)",
    }),
  }),
  statCard: css({
    background: color.neutral0,
    borderRadius: theme.s3,
    border: "1.5px solid transparent",
    backgroundImage: `linear-gradient(${color.neutral0}, ${color.neutral0}), linear-gradient(135deg, ${color.secondary500}, ${color.primary500})`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    padding: theme.s4,
    boxShadow: theme.elevation.xsmall,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.elevation.medium,
    },
  }),
  statValue: css({
    ...font.boldH5_20,
    color: color.neutral900,
  }),
  statRevenue: css({
    color: color.semantics.success.green500,
    fontSize: "18px",
  }),
  statFee: css({
    color: color.semantics.error.red500,
    fontSize: "18px",
  }),
  statLabel: css({
    ...font.regular12,
    color: color.neutral600,
    marginTop: theme.s1,
  }),
  chartsRow: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s4,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  chartCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: theme.elevation.xsmall,
  }),
  chartTitle: css({
    ...font.bold14,
    color: color.neutral900,
    marginBottom: theme.s3,
  }),
  tableCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: theme.elevation.xsmall,
  }),
  tableHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s3,
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  tableTitle: css({
    ...font.bold14,
    color: color.neutral900,
  }),
  tableScroll: css({
    overflowX: "auto",
  }),
  table: css({
    width: "100%",
    borderCollapse: "collapse",
    ...font.regular14,
  }),
  th: css({
    textAlign: "left",
    padding: `${theme.s2} ${theme.s3}`,
    borderBottom: `2px solid ${color.neutral200}`,
    ...font.medium14,
    color: color.neutral700,
    whiteSpace: "nowrap",
  }),
  tr: css({
    ":hover": {
      background: color.neutral50,
    },
  }),
  td: css({
    padding: `${theme.s2} ${theme.s3}`,
    borderBottom: `1px solid ${color.neutral100}`,
    color: color.neutral900,
    verticalAlign: "middle",
  }),
  orderId: css({
    fontFamily: "monospace",
    fontSize: "12px",
    color: color.neutral600,
  }),
  statusTag: css({
    display: "inline-block",
    padding: `2px ${theme.s2}`,
    borderRadius: theme.s1,
    ...font.medium12,
    background: color.neutral100,
    color: color.neutral700,
  }),
  feeCell: css({
    color: color.semantics.error.red500,
  }),
  profitCell: css({
    color: color.semantics.success.green500,
  }),
  empty: css({
    ...font.regular14,
    color: color.neutral700,
    padding: theme.s4,
  }),
  secondaryButton: css({
    border: `1px solid ${color.neutral300}`,
    background: color.neutral0,
    color: color.neutral700,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    ":hover": {
      borderColor: color.genz.purple,
      color: color.genz.purple,
    },
  }),
  exportButton: css({
    background: color.genz.purple,
    color: color.neutral0,
    border: "none",
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    ":hover:not(:disabled)": {
      opacity: 0.9,
    },
  }),
}
