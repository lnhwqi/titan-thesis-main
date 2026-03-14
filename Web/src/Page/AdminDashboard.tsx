import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as LoginAction from "../Action/Login"

export type Props = { state: State }

export default function AdminDashboardPage(_props: Props): JSX.Element {
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"

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

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Seller Moderation</h2>
          <p className={styles.cardText}>
            Track seller verification and review pending approvals.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("Home", {})))}
          >
            Open seller queue
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
