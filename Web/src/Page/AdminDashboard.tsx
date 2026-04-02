import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as LoginAction from "../Action/Login"
import * as AdminDashboardAction from "../Action/AdminDashboard"

export type Props = { state: State }

export default function AdminDashboardPage(_props: Props): JSX.Element {
  const { state } = _props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const pending = state.adminDashboard.pendingSellersResponse
  const adminHome = state.adminDashboard.adminHomeResponse
  const orderPayments = state.adminDashboard.orderPaymentsResponse
  const approving = state.adminDashboard.approvingSellerIDs
  const sendingVerifyEmail = state.adminDashboard.sendingVerifyEmailSellerIDs
  const flashMessage = state.adminDashboard.flashMessage

  if (!isAdmin) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            This dashboard is restricted to authenticated admin accounts.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminLogin", {})))}
          >
            Go to admin login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Titan Management</p>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>
            Review operations, moderation, and marketplace health in one place.
          </p>
        </div>

        <button
          className={styles.primaryButton}
          onClick={() => emit(LoginAction.logout())}
        >
          Logout
        </button>
      </header>

      {flashMessage != null ? (
        <div className={styles.flashCard}>
          <span>{flashMessage}</span>
          <button
            className={styles.flashDismiss}
            onClick={() => emit(AdminDashboardAction.clearFlashMessage())}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Seller Moderation</h2>
          <p className={styles.cardText}>
            Track seller verification and review pending approvals.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.loadPendingSellers())}
          >
            Refresh queue
          </button>

          {renderPendingSellers(pending, approving, sendingVerifyEmail)}
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Wallet</h2>
          <p className={styles.cardText}>
            Current admin wallet balance for marketplace operations.
          </p>
          {renderWallet(adminHome)}
        </article>

        <article className={styles.cardWide}>
          <h2 className={styles.cardTitle}>Payment Orders Status Tracking</h2>
          <p className={styles.cardText}>
            Track paid orders and monitor shipping/payment statuses in one view.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.loadOrderPayments())}
          >
            Refresh order payments
          </button>

          {renderOrderPayments(orderPayments)}
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Report Settings</h2>
          <p className={styles.cardText}>
            Define how many hours users can submit reports after delivery.
          </p>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              value={state.adminDashboard.reportWindowHours}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeReportWindowHours(
                    e.currentTarget.value,
                  ),
                )
              }
              placeholder="72"
              inputMode="numeric"
            />
            <button
              className={styles.secondaryButton}
              onClick={() => emit(AdminDashboardAction.saveReportWindowHours())}
            >
              Save
            </button>
          </div>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminReports", {})))}
          >
            Open reports queue
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Platform Health</h2>
          <p className={styles.cardText}>
            Monitor product availability, pricing consistency, and stock alerts.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("Search", { name: null })))}
          >
            Inspect products
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Category Management</h2>
          <p className={styles.cardText}>
            Manage the full category tree from a dedicated page with
            branch-based creation and edit tools.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() =>
              emit(navigateTo(toRoute("AdminCategoryManagement", {})))
            }
          >
            Open category manager
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Poster Management</h2>
          <p className={styles.cardText}>
            Create, update, and remove homepage posters with image scale and
            position controls.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() =>
              emit(navigateTo(toRoute("AdminPosterManagement", {})))
            }
          >
            Open poster manager
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>User Support</h2>
          <p className={styles.cardText}>
            Resolve account issues and keep marketplace trust high.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("Home", {})))}
          >
            Review activity
          </button>
        </article>
      </section>
    </div>
  )
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 15% 20%, ${color.secondary100} 0%, transparent 35%),` +
      `radial-gradient(circle at 80% 10%, ${color.secondary200} 0%, transparent 32%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
  }),
  hero: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    marginBottom: theme.s8,
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: color.secondary500,
    marginBottom: theme.s1,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    marginTop: theme.s2,
    maxWidth: "700px",
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s4,
    ...bp.md({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    }),
  }),
  cardWide: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    ...bp.md({
      gridColumn: "span 2",
    }),
  }),
  card: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
  }),
  cardTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  cardText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
    minHeight: "56px",
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
  }),
  formRow: css({
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
  }),
  input: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    width: "120px",
  }),
  sellerList: css({
    marginTop: theme.s2,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  sellerItem: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    background: color.secondary50,
    padding: theme.s3,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  sellerMeta: css({
    ...font.regular13,
    color: color.neutral700,
  }),
  walletValue: css({
    ...font.boldH3_29,
    color: color.secondary500,
    margin: 0,
  }),
  statsRow: css({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.s2,
    ...bp.md({
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    }),
  }),
  statCell: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    background: color.secondary50,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  statLabel: css({
    ...font.regular12,
    color: color.neutral700,
  }),
  statValue: css({
    ...font.bold17,
    color: color.secondary500,
  }),
  tableWrap: css({
    width: "100%",
    overflowX: "auto",
  }),
  orderTable: css({
    width: "100%",
    borderCollapse: "collapse",
    "& th": {
      textAlign: "left",
      ...font.bold12,
      color: color.neutral700,
      borderBottom: `1px solid ${color.secondary200}`,
      padding: `${theme.s2} ${theme.s1}`,
    },
    "& td": {
      ...font.regular12,
      color: color.neutral800,
      borderBottom: `1px solid ${color.secondary100}`,
      padding: `${theme.s2} ${theme.s1}`,
      verticalAlign: "top",
    },
  }),
  statusPill: css({
    display: "inline-flex",
    alignItems: "center",
    borderRadius: theme.s2,
    padding: `2px ${theme.s2}`,
    ...font.bold12,
    background: color.secondary100,
    color: color.secondary500,
  }),
  sellerItemAction: css({
    marginTop: theme.s1,
    border: "none",
    borderRadius: theme.s2,
    background: color.secondary500,
    color: color.neutral0,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
    width: "fit-content",
  }),
  sellerItemActionDisabled: css({
    opacity: 0.6,
    cursor: "not-allowed",
  }),
  flashCard: css({
    marginBottom: theme.s4,
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary50,
    padding: `${theme.s2} ${theme.s3}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...font.medium14,
    color: color.neutral800,
  }),
  flashDismiss: css({
    border: "none",
    background: "none",
    textDecoration: "underline",
    color: color.secondary500,
    ...font.medium12,
    cursor: "pointer",
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: color.neutral100,
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "520px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s6,
    boxShadow: theme.elevation.large,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    alignItems: "flex-start",
  }),
  gateTitle: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
}

function renderWallet(
  home: State["adminDashboard"]["adminHomeResponse"],
): JSX.Element {
  switch (home._t) {
    case "NotAsked":
      return (
        <div className={styles.sellerMeta}>Wallet data not loaded yet.</div>
      )
    case "Loading":
      return <div className={styles.sellerMeta}>Loading wallet...</div>
    case "Failure":
      return <div className={styles.sellerMeta}>Unable to load wallet.</div>
    case "Success":
      return (
        <p className={styles.walletValue}>
          {home.data.admin.wallet.unwrap().toLocaleString()}đ
        </p>
      )
  }
}

function renderOrderPayments(
  response: State["adminDashboard"]["orderPaymentsResponse"],
): JSX.Element {
  switch (response._t) {
    case "NotAsked":
      return <div className={styles.sellerMeta}>No order payment data yet.</div>
    case "Loading":
      return <div className={styles.sellerMeta}>Loading order payments...</div>
    case "Failure":
      return (
        <div className={styles.sellerMeta}>Unable to load order payments.</div>
      )
    case "Success": {
      const orders = response.data.orders
      if (orders.length === 0) {
        return <div className={styles.sellerMeta}>No paid orders found.</div>
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
              <div className={styles.statValue}>{statusCount.REPORTED ?? 0}</div>
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
                    <td>{order.price.unwrap().toLocaleString()}đ</td>
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

function renderPendingSellers(
  pending: State["adminDashboard"]["pendingSellersResponse"],
  approving: string[],
  sendingVerifyEmail: string[],
): JSX.Element {
  switch (pending._t) {
    case "NotAsked":
      return <div className={styles.sellerMeta}>No data loaded yet.</div>
    case "Loading":
      return <div className={styles.sellerMeta}>Loading pending sellers...</div>
    case "Failure":
      return (
        <div className={styles.sellerMeta}>Failed to load pending sellers.</div>
      )
    case "Success": {
      if (pending.data.sellers.length === 0) {
        return (
          <div className={styles.sellerMeta}>
            No sellers waiting for approval.
          </div>
        )
      }

      return (
        <div className={styles.sellerList}>
          {pending.data.sellers.map((seller) => {
            const id = seller.id.unwrap()
            const isApproving = approving.includes(id)
            const isSendingVerifyEmail = sendingVerifyEmail.includes(id)
            return (
              <div
                key={id}
                className={styles.sellerItem}
              >
                <strong>{seller.shopName.unwrap()}</strong>
                <div className={styles.sellerMeta}>
                  Owner: {seller.name.unwrap()}
                </div>
                <div className={styles.sellerMeta}>
                  Email: {seller.email.unwrap()}
                </div>
                <button
                  className={`${styles.sellerItemAction} ${
                    isSendingVerifyEmail ? styles.sellerItemActionDisabled : ""
                  }`}
                  disabled={isSendingVerifyEmail}
                  onClick={() =>
                    emit(AdminDashboardAction.sendVerifyEmail(seller.id))
                  }
                >
                  {isSendingVerifyEmail
                    ? "Sending verify email..."
                    : "Send Verify Email"}
                </button>
                <button
                  className={`${styles.sellerItemAction} ${
                    isApproving ? styles.sellerItemActionDisabled : ""
                  }`}
                  disabled={isApproving}
                  onClick={() =>
                    emit(AdminDashboardAction.approveSeller(seller.id))
                  }
                >
                  {isApproving ? "Approving..." : "Approve Seller"}
                </button>
              </div>
            )
          })}
        </div>
      )
    }
  }
}
