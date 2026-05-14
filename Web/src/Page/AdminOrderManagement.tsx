import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { color, font, theme, bp } from "../View/Theme"
import * as AdminDashboardAction from "../Action/Admin"

type Props = { state: State }

export default function AdminPosterManagementPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"

  const orderPayments = state.adminDashboard.orderPaymentsResponse

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to manage orders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Order Management</h1>
          <p className={styles.subtitle}>
            View and manage all user orders in the system.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.goToAdminDashboard())}
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.sectionTitle}>Order List</h2>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.loadOrderPayments())}
          >
            Refresh queue
          </button>
        </div>

        {renderOrderPayments(orderPayments)}
      </section>
    </div>
  )
}

function renderOrderPayments(
  response: State["adminDashboard"]["orderPaymentsResponse"],
): JSX.Element {
  switch (response._t) {
    case "NotAsked":
      return <div className={styles.infoMeta}>No order payment data yet.</div>
    case "Loading":
      return <div className={styles.infoMeta}>Loading order payments...</div>
    case "Failure":
      return (
        <div className={styles.infoMetaError}>
          Unable to load order payments.
        </div>
      )
    case "Success": {
      const orders = response.data.orders
      if (orders.length === 0) {
        return <div className={styles.infoMeta}>No paid orders found.</div>
      }

      const statusCount = orders.reduce<Record<string, number>>(
        (acc, order) => {
          const key = order.status
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        },
        {},
      )

      const recent = orders.slice(0, 8)

      return (
        <>
          <div className={styles.statsRow}>
            <div className={styles.statCell}>
              <div className={styles.statLabel}>Total Paid</div>
              <div className={styles.statValue}>{orders.length}</div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statLabel}>Packed</div>
              <div className={styles.statValue}>{statusCount.PACKED ?? 0}</div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statLabel}>In Transit</div>
              <div className={styles.statValue}>
                {statusCount.IN_TRANSIT ?? 0}
              </div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statLabel}>Delivered/Received</div>
              <div className={styles.statValue}>
                {(statusCount.DELIVERED ?? 0) + (statusCount.RECEIVED ?? 0)}
              </div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statLabel}>Reported</div>
              <div className={styles.statValue}>
                {statusCount.REPORTED ?? 0}
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id.unwrap()}>
                    <td>{order.id.unwrap()}</td>
                    <td>{order.username.unwrap()}</td>
                    <td>{order.paymentMethod}</td>
                    <td>
                      <span className={styles.statusPill}>{order.status}</span>
                    </td>
                    <td className={styles.priceCell}>
                      {order.price.unwrap().toLocaleString()}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )
    }
  }
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%),` +
      `radial-gradient(circle at 85% 12%, ${color.genz.purple200} 0%, transparent 30%),` +
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
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    marginTop: theme.s2,
  }),
  panel: css({
    background: color.neutral0,
    borderRadius: theme.s4,
    border: `1px solid ${color.genz.purple100}`,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  panelHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s5,
    flexWrap: "wrap",
    gap: theme.s4,
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    margin: 0,
    color: color.neutral900,
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
    transition: "background 0.2s",
    "&:hover": {
      background: color.neutral50,
    },
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
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
    maxWidth: "min(100%, 480px)",
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

  // --- New Table & Stats CSS ---

  infoMeta: css({
    ...font.regular14,
    color: color.neutral600,
    padding: theme.s4,
    textAlign: "center",
    background: color.neutral50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.genz.purple200}`,
  }),
  infoMetaError: css({
    ...font.regular14,
    color: color.semantics.error.red500,
    padding: theme.s4,
    textAlign: "center",
    background: color.semantics.error.red50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.genz.pink}`,
  }),
  statsRow: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s4,
    marginBottom: theme.s5,
    ...bp.md({
      gridTemplateColumns: "repeat(3, 1fr)",
    }),
    ...bp.lg({
      gridTemplateColumns: "repeat(5, 1fr)",
    }),
  }),
  statCell: css({
    background: color.neutral50,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  statLabel: css({
    ...font.medium14,
    color: color.neutral600,
  }),
  statValue: css({
    ...font.boldH4_24,
    color: color.neutral900,
    margin: 0,
  }),
  tableWrap: css({
    width: "100%",
    overflowX: "auto",
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s3,
    background: color.neutral0,
  }),
  orderTable: css({
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    "th, td": {
      padding: `${theme.s3} ${theme.s4}`,
      borderBottom: `1px solid ${color.genz.purple100}`,
      ...font.regular14,
      color: color.neutral800,
      whiteSpace: "nowrap",
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
    "tr:hover td": {
      background: color.neutral50,
    },
  }),
  priceCell: css({
    ...font.medium14,
    color: color.neutral900,
  }),
  statusPill: css({
    display: "inline-block",
    padding: `${theme.s1} ${theme.s2}`,
    background: color.genz.purple100,
    color: color.genz.purple,
    borderRadius: theme.s2,
    ...font.bold12,
    letterSpacing: "0.5px",
  }),
}
