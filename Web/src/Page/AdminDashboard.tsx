import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as LoginAction from "../Action/Login"
import * as AdminDashboardAction from "../Action/Admin"
import AdminStatsChart from "../View/AdminStatsChart"

export type Props = { state: State }

export default function AdminDashboardPage(_props: Props): JSX.Element {
  const { state } = _props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const adminHome = state.adminDashboard.adminHomeResponse

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

      <AdminStatsChart statsResponse={state.adminDashboard.statsResponse} />

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Seller Moderation</h2>
          <p className={styles.cardText}>
            Track seller verification and review pending approvals.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() =>
              emit(navigateTo(toRoute("AdminSellerModeration", {})))
            }
          >
            View List Seller Registrations
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Wallet</h2>
          <p className={styles.cardText}>
            Current admin wallet balance for marketplace operations.
          </p>
          {renderWallet(adminHome)}
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Order Management</h2>
          <p className={styles.cardText}>
            Manage application settings and configurations.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() =>
              emit(navigateTo(toRoute("AdminOrderManagement", {})))
            }
          >
            Manage Orders
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Settings</h2>
          <p className={styles.cardText}>
            Manage application settings and configurations.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminSetting", {})))}
          >
            Setting Configures
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Report Management</h2>
          <p className={styles.cardText}>
            Review and manage user-submitted reports on orders and products.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminReports", {})))}
          >
            View Reports
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
