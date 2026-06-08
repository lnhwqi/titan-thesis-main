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

type DashboardRoute =
  | "AdminSellerModeration"
  | "AdminOrderManagement"
  | "AdminReports"
  | "AdminCategoryManagement"
  | "AdminPosterManagement"
  | "AdminCoinRain"
  | "AdminUserManagement"
  | "AdminSupportMonitoring"
  | "AdminSetting"

type WorkstreamCard = {
  title: string
  description: string
  cta: string
  route: DashboardRoute
  badge?: string
}

type WorkstreamSection = {
  title: string
  description: string
  cards: WorkstreamCard[]
}

type QuickStatTone = "default" | "success" | "warning"

type QuickStat = {
  label: string
  value: string
  hint: string
  tone: QuickStatTone
}

const WORKSTREAMS: WorkstreamSection[] = [
  {
    title: "Commerce Operations",
    description:
      "Keep order flow, seller compliance, and dispute resolution moving.",
    cards: [
      {
        title: "Seller Moderation",
        description:
          "Review pending registrations, verify sellers, and resolve onboarding delays.",
        cta: "Open Seller Moderation",
        route: "AdminSellerModeration",
        badge: "Priority",
      },
      {
        title: "Order Management",
        description:
          "Track order pipeline and investigate fulfillment bottlenecks.",
        cta: "Open Order Management",
        route: "AdminOrderManagement",
      },
      {
        title: "Report Management",
        description:
          "Handle user-submitted disputes and finalize report outcomes.",
        cta: "Open Reports",
        route: "AdminReports",
        badge: "Risk",
      },
    ],
  },
  {
    title: "Experience Control",
    description:
      "Shape storefront discovery, campaign visibility, and merchandising quality.",
    cards: [
      {
        title: "Category Management",
        description:
          "Maintain category taxonomy and branch hierarchy for cleaner browse flows.",
        cta: "Open Categories",
        route: "AdminCategoryManagement",
      },
      {
        title: "Poster Management",
        description:
          "Publish and tune homepage visual campaigns with image positioning controls.",
        cta: "Open Posters",
        route: "AdminPosterManagement",
      },
      {
        title: "Event Panel",
        description:
          "Control event activation and coin campaign configuration windows.",
        cta: "Open Event Panel",
        route: "AdminCoinRain",
      },
    ],
  },
  {
    title: "Governance And Support",
    description:
      "Monitor user health, AI support quality, and platform-wide guardrails.",
    cards: [
      {
        title: "User Management",
        description:
          "Search users, toggle account status, and send support/admin messages.",
        cta: "Open User Management",
        route: "AdminUserManagement",
      },
      {
        title: "Support AI Monitoring",
        description:
          "Inspect support response quality, latency, and rate-limit behavior.",
        cta: "Open Support Monitoring",
        route: "AdminSupportMonitoring",
        badge: "Live",
      },
      {
        title: "Settings",
        description:
          "Adjust operational policy windows and marketplace-level runtime controls.",
        cta: "Open Settings",
        route: "AdminSetting",
      },
    ],
  },
]

export default function AdminDashboardPage(_props: Props): JSX.Element {
  const { state } = _props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const adminHome = state.adminDashboard.adminHomeResponse
  const adminProfile = adminHome._t === "Success" ? adminHome.data.admin : null
  const pendingSellerCount =
    state.adminDashboard.pendingSellersResponse._t === "Success"
      ? state.adminDashboard.pendingSellersResponse.data.sellers.length
      : null
  const orders =
    state.adminDashboard.orderPaymentsResponse._t === "Success"
      ? state.adminDashboard.orderPaymentsResponse.data.orders
      : null
  const issueOrders =
    orders == null
      ? null
      : orders.filter(
          (order) =>
            order.status === "REPORTED" || order.status === "DELIVERY_ISSUE",
        ).length
  const walletSnapshot = getWalletSnapshot(adminHome)
  const quickStats: QuickStat[] = [
    {
      label: "Wallet",
      value: walletSnapshot.value,
      hint: walletSnapshot.hint,
      tone: walletSnapshot.tone,
    },
    {
      label: "Pending Seller Reviews",
      value: formatCount(pendingSellerCount),
      hint:
        pendingSellerCount == null
          ? "Waiting for live sync"
          : pendingSellerCount > 0
            ? "Review queue requires attention"
            : "Approval queue is clear",
      tone:
        pendingSellerCount != null && pendingSellerCount > 0
          ? "warning"
          : "default",
    },
    {
      label: "Orders With Issues",
      value: formatCount(issueOrders),
      hint: "Reported or delivery_issue statuses",
      tone: issueOrders != null && issueOrders > 0 ? "warning" : "success",
    },
  ]

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
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Titan Management</p>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>
            Operational cockpit for growth, moderation, and high-risk
            intervention.
          </p>

          <div className={styles.identityRow}>
            <span className={styles.identityPill}>
              {adminProfile == null
                ? "Admin Session"
                : `Signed in: ${adminProfile.name.unwrap()}`}
            </span>
            {adminProfile != null ? (
              <span className={styles.identityText}>
                {adminProfile.email.unwrap()}
              </span>
            ) : null}
          </div>
        </div>

        <div className={styles.heroActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.loadOverview())}
          >
            Refresh Data
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => emit(LoginAction.logout())}
          >
            Logout
          </button>
        </div>
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

      <section className={styles.quickStatsGrid}>
        {quickStats.map((stat) => (
          <article
            key={stat.label}
            className={`${styles.quickStatCard} ${quickStatToneClass(stat.tone)}`}
          >
            <div className={styles.quickStatLabel}>{stat.label}</div>
            <div className={styles.quickStatValue}>{stat.value}</div>
            <div className={styles.quickStatHint}>{stat.hint}</div>
          </article>
        ))}
      </section>

      <section className={styles.analyticsPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Performance Analytics</h2>
          <p className={styles.sectionSubtitle}>
            Track growth, financial movement, and support health in one place.
          </p>
        </div>

        <AdminStatsChart
          activeTab={state.adminDashboard.dashboardAnalyticsTab}
          onSelectTab={(tab) =>
            emit(AdminDashboardAction.onChangeDashboardAnalyticsTab(tab))
          }
          statsResponse={state.adminDashboard.statsResponse}
          supportMetricsResponse={state.adminDashboard.supportMetricsResponse}
          supportMetricsHistoryResponse={
            state.adminDashboard.supportMetricsHistoryResponse
          }
        />
      </section>

      <section className={styles.workstreamGrid}>
        {WORKSTREAMS.map((stream) => (
          <article
            key={stream.title}
            className={styles.workstreamPanel}
          >
            <header className={styles.workstreamHeader}>
              <h2 className={styles.workstreamTitle}>{stream.title}</h2>
              <p className={styles.workstreamDescription}>
                {stream.description}
              </p>
            </header>

            <div className={styles.workstreamCards}>
              {stream.cards.map((card) => (
                <article
                  key={card.title}
                  className={styles.workCard}
                >
                  {card.badge != null ? (
                    <span className={styles.workCardBadge}>{card.badge}</span>
                  ) : null}
                  <h3 className={styles.workCardTitle}>{card.title}</h3>
                  <p className={styles.workCardText}>{card.description}</p>
                  <button
                    className={styles.ghostButton}
                    onClick={() => emit(navigateTo(toRoute(card.route, {})))}
                  >
                    {card.cta}
                  </button>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s4,
    background:
      `radial-gradient(circle at 8% 12%, ${color.genz.pink100} 0%, transparent 32%),` +
      `radial-gradient(circle at 88% 8%, ${color.genz.purple100} 0%, transparent 34%),` +
      `radial-gradient(circle at 80% 84%, ${color.semantics.info.blue20} 0%, transparent 28%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  hero: css({
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    flexDirection: "column",
    gap: theme.s4,
    background: `linear-gradient(135deg, ${color.neutral0} 0%, ${color.secondary20} 100%)`,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s5,
    boxShadow: theme.elevation.medium,
    padding: theme.s6,
    marginBottom: theme.s5,
    ...bp.md({
      flexDirection: "row",
      padding: theme.s7,
    }),
  }),
  heroCopy: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    minWidth: 0,
    maxWidth: "860px",
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
    margin: 0,
    maxWidth: "760px",
  }),
  identityRow: css({
    marginTop: theme.s2,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.s2,
  }),
  identityPill: css({
    ...font.medium12,
    color: color.secondary500,
    background: color.secondary50,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.brFull,
    padding: `${theme.s1} ${theme.s3}`,
  }),
  identityText: css({
    ...font.regular13,
    color: color.neutral600,
  }),
  heroActions: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    alignItems: "flex-start",
    ...bp.md({
      justifyContent: "flex-end",
      alignContent: "flex-start",
      minWidth: "240px",
    }),
  }),
  quickStatsGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    marginBottom: theme.s5,
    gap: theme.s4,
    ...bp.md({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    }),
    "@media (min-width: 1200px)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },
  }),
  quickStatCard: css({
    background: color.neutral0,
    border: `1px solid ${color.neutral200}`,
    borderRadius: theme.s4,
    padding: theme.s4,
    boxShadow: theme.elevation.small,
    display: "grid",
    gap: theme.s1,
    minHeight: "130px",
  }),
  quickStatWarning: css({
    borderColor: color.semantics.warning.orange500,
    background: `linear-gradient(150deg, ${color.neutral0} 0%, ${color.semantics.warning.orange20} 100%)`,
  }),
  quickStatSuccess: css({
    borderColor: color.semantics.success.green500,
    background: `linear-gradient(150deg, ${color.neutral0} 0%, ${color.semantics.success.green20} 100%)`,
  }),
  quickStatLabel: css({
    ...font.medium12,
    color: color.neutral600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  }),
  quickStatValue: css({
    ...font.boldH3_29,
    color: color.neutral900,
    marginTop: theme.s1,
  }),
  quickStatHint: css({
    ...font.regular13,
    color: color.neutral600,
  }),
  analyticsPanel: css({
    background: color.neutral0,
    border: `1px solid ${color.neutral200}`,
    borderRadius: theme.s5,
    boxShadow: theme.elevation.medium,
    padding: theme.s4,
    marginBottom: theme.s5,
    ...bp.md({
      padding: theme.s5,
    }),
  }),
  sectionHeader: css({
    display: "grid",
    gap: theme.s1,
    marginBottom: theme.s3,
  }),
  sectionTitle: css({
    ...font.boldH4_24,
    color: color.neutral900,
    margin: 0,
  }),
  sectionSubtitle: css({
    ...font.regular14,
    color: color.neutral600,
    margin: 0,
  }),
  workstreamGrid: css({
    display: "grid",
    gap: theme.s4,
    gridTemplateColumns: "1fr",
    ...bp.md({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      alignItems: "start",
    }),
  }),
  workstreamPanel: css({
    background: color.neutral0,
    border: `1px solid ${color.neutral200}`,
    borderRadius: theme.s4,
    padding: theme.s4,
    boxShadow: theme.elevation.medium,
    display: "grid",
    gap: theme.s3,
  }),
  workstreamHeader: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  workstreamTitle: css({
    ...font.bold17,
    margin: 0,
  }),
  workstreamDescription: css({
    ...font.regular14,
    color: color.neutral600,
    margin: 0,
  }),
  workstreamCards: css({
    display: "grid",
    gap: theme.s3,
  }),
  workCard: css({
    background: `linear-gradient(160deg, ${color.neutral0} 0%, ${color.secondary20} 100%)`,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    display: "grid",
    gap: theme.s2,
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: theme.elevation.small,
      borderColor: color.secondary200,
    },
  }),
  workCardBadge: css({
    ...font.bold10,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: color.secondary500,
    background: color.secondary50,
    borderRadius: theme.brFull,
    border: `1px solid ${color.secondary100}`,
    padding: `2px ${theme.s2}`,
    width: "fit-content",
  }),
  workCardTitle: css({
    ...font.bold14,
    color: color.neutral900,
    margin: 0,
  }),
  workCardText: css({
    ...font.regular13,
    color: color.neutral700,
    margin: 0,
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    "&:hover": {
      background: color.secondary400,
    },
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary200}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
    "&:hover": {
      background: color.secondary20,
      borderColor: color.secondary300,
    },
  }),
  ghostButton: css({
    border: `1px solid ${color.secondary200}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium12,
    width: "fit-content",
    "&:hover": {
      background: color.secondary20,
      borderColor: color.secondary300,
    },
  }),
  flashCard: css({
    marginBottom: theme.s4,
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary20,
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
    maxWidth: "min(100%, 520px)",
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

function getWalletSnapshot(
  home: State["adminDashboard"]["adminHomeResponse"],
): { value: string; hint: string; tone: QuickStatTone } {
  switch (home._t) {
    case "NotAsked":
      return {
        value: "...",
        hint: "Wallet sync has not started",
        tone: "default",
      }
    case "Loading":
      return {
        value: "...",
        hint: "Refreshing wallet balance",
        tone: "default",
      }
    case "Failure":
      return {
        value: "Unavailable",
        hint: "Could not load treasury wallet",
        tone: "warning",
      }
    case "Success":
      return {
        value: `${home.data.admin.wallet.unwrap().toLocaleString()} VND`,
        hint: "Available budget for operations",
        tone: "success",
      }
  }
}

function formatCount(value: number | null): string {
  return value == null ? "..." : value.toLocaleString()
}

function quickStatToneClass(tone: QuickStatTone): string {
  switch (tone) {
    case "warning":
      return styles.quickStatWarning
    case "success":
      return styles.quickStatSuccess
    case "default":
      return ""
  }
}
