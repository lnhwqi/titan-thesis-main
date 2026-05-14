import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as ReportAction from "../Action/Report"
import { navigateTo, toRoute } from "../Route"
import { ReportStatus } from "../../../Core/App/Report"
import * as AuthToken from "../App/AuthToken"
import { fadeSlideUp } from "../View/Theme/Keyframe"

type Props = { state: State }

export default function SellerReportsPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Seller Access Required</h1>
          <p className={styles.gateText}>
            Please log in as seller to view reports.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerLogin", {})))}
          >
            Go to Seller Login
          </button>
        </div>
      </div>
    )
  }

  const isSubmitting = state.report.sellerRespondResponse._t === "Loading"
  const confirmState = state.report.sellerConfirmState

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Seller Workspace</p>
          <h1 className={styles.heroTitle}>Seller Reports</h1>
          <p className={styles.heroSubtitle}>
            Manage dispute reports and respond to buyer claims.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(ReportAction.onEnterSellerReportsRoute())}
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

      {state.report.flashMessage != null ? (
        <div className={styles.notice}>{state.report.flashMessage}</div>
      ) : null}

      {state.report.sellerReportsResponse._t === "Loading" ? (
        <div className={styles.info}>Loading reports...</div>
      ) : null}

      {state.report.sellerReports.length === 0 &&
      state.report.sellerReportsResponse._t === "Success" ? (
        <div className={styles.info}>No reports assigned to your shop.</div>
      ) : null}

      <div className={styles.list}>
        {state.report.sellerReports.map((report) => {
          const id = report.id.unwrap()
          const canAgreeCashback = canSellerAgreeCashback(report.status)

          return (
            <article
              key={id}
              className={styles.card}
            >
              <div className={styles.cardTopRow}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardId}>#{id.slice(0, 8)}</span>
                  <span
                    className={styles.statusPill}
                    data-closed={!canAgreeCashback}
                  >
                    {humanizeStatus(report.status)}
                  </span>
                </div>
                <div className={styles.cardCategory}>{report.category}</div>
              </div>

              <div className={styles.cardTitle}>{report.title}</div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Report ID</span>
                  <span className={styles.metaValue}>{id}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order ID</span>
                  <span className={styles.metaValue}>
                    {report.orderID.unwrap()}
                  </span>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>User Claim</div>
                <div className={styles.sectionBody}>
                  {report.userDescription.unwrap() || "—"}
                </div>
                {report.userUrlImgs.length > 0 ? (
                  <div className={styles.imageList}>
                    {report.userUrlImgs.map((img, idx) => (
                      <a
                        key={idx}
                        href={img.unwrap()}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.imageLink}
                      >
                        Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Your Response</div>
                <div className={styles.sectionBody}>
                  {report.sellerDescription?.unwrap() ?? "No response yet"}
                </div>
                {report.sellerUrlImgs.length > 0 ? (
                  <div className={styles.imageList}>
                    {report.sellerUrlImgs.map((img, idx) => (
                      <a
                        key={idx}
                        href={img.unwrap()}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.imageLink}
                      >
                        Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              {report.resultTextAdmin != null ? (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Admin Decision</div>
                  <div className={styles.sectionBody}>
                    {report.resultTextAdmin.unwrap()}
                  </div>
                </div>
              ) : null}

              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  disabled={isSubmitting || canAgreeCashback === false}
                  onClick={() =>
                    emit(
                      ReportAction.openSellerConfirmCard(id, "AGREE_CASHBACK"),
                    )
                  }
                >
                  Agree Cashback
                </button>
              </div>
              <div className={styles.hint}>{sellerHint(report.status)}</div>
            </article>
          )
        })}
      </div>

      {confirmState != null ? (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <h3 className={styles.confirmTitle}>Please Confirm</h3>
            <p className={styles.confirmText}>
              Agreeing cashback is treated as your final agreement for this
              report stage. Confirm to continue.
            </p>
            <p className={styles.confirmMeta}>
              Report ID: {confirmState.reportID}
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.secondaryButton}
                disabled={isSubmitting}
                onClick={() => emit(ReportAction.closeSellerConfirmCard())}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={isSubmitting}
                onClick={() => emit(ReportAction.confirmSellerAction())}
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function canSellerAgreeCashback(status: ReportStatus): boolean {
  return (
    status === "OPEN" ||
    status === "SELLER_REPLIED" ||
    status === "UNDER_REVIEW"
  )
}

function humanizeStatus(status: ReportStatus): string {
  switch (status) {
    case "OPEN":
      return "Open"
    case "SELLER_REPLIED":
      return "Seller Replied"
    case "UNDER_REVIEW":
      return "Under Review"
    case "REFUND_APPROVED":
      return "Refund Approved"
    case "CASHBACK_COMPLETED":
      return "Cashback Completed"
    case "RESOLVED":
      return "Resolved"
    case "REJECTED":
      return "Rejected"
  }
}

function sellerHint(status: ReportStatus): string {
  if (status === "REFUND_APPROVED") {
    return "You agreed cashback. Admin will complete cashback and close the report."
  }

  if (
    status === "CASHBACK_COMPLETED" ||
    status === "RESOLVED" ||
    status === "REJECTED"
  ) {
    return "This report is closed. No additional seller actions are available."
  }

  return "You can agree cashback for this reported order."
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    display: "grid",
    gap: theme.s5,
    alignContent: "start",
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.secondary10}`,
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
    maxWidth: "min(100%, 420px)",
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
      content: '""',
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
  list: css({ display: "grid", gap: theme.s3 }),
  card: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    display: "grid",
    gap: theme.s3,
    background: color.neutral0,
    boxShadow: theme.elevation.xsmall,
  }),
  cardTopRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  cardMeta: css({ display: "flex", alignItems: "center", gap: theme.s2 }),
  cardId: css({
    ...font.bold14,
    color: color.genz.pink,
    background: color.genz.pinkDim,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
  }),
  statusPill: css({
    ...font.medium12,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    border: `1px solid ${color.genz.purple200}`,
    color: color.genz.purple,
    background: color.genz.purpleDim,
    "&[data-closed='true']": {
      border: `1px solid ${color.neutral300}`,
      color: color.neutral600,
      background: color.neutral100,
    },
  }),
  cardCategory: css({
    ...font.medium12,
    color: color.neutral600,
    background: color.neutral100,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
  }),
  cardTitle: css({ ...font.bold14, color: color.neutral900 }),
  metaGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: theme.s2,
  }),
  metaItem: css({
    display: "grid",
    gap: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    borderRadius: theme.s1,
    border: `1px solid ${color.genz.purple100}`,
    background: color.neutral100,
  }),
  metaLabel: css({ ...font.medium12, color: color.genz.purple }),
  metaValue: css({
    ...font.regular13,
    color: color.neutral800,
    wordBreak: "break-all",
  }),
  section: css({ display: "grid", gap: theme.s1 }),
  sectionTitle: css({
    ...font.bold14,
    color: color.neutral800,
  }),
  sectionBody: css({
    ...font.regular14,
    color: color.neutral700,
    background: color.neutral50,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    border: `1px solid ${color.neutral200}`,
  }),
  imageList: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    marginTop: theme.s1,
  }),
  imageLink: css({
    ...font.medium12,
    color: color.genz.purple,
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    textDecoration: "none",
    "&:hover": { background: color.genz.purpleDim },
  }),
  actions: css({ display: "flex", gap: theme.s2 }),
  primaryButton: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
  }),
  hint: css({ ...font.regular13, color: color.neutral600 }),
  confirmOverlay: css({
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s4,
    zIndex: 50,
  }),
  confirmCard: css({
    width: "100%",
    maxWidth: "min(100%, 520px)",
    background: color.neutral0,
    borderRadius: theme.s3,
    border: `1px solid ${color.genz.purple100}`,
    boxShadow: theme.elevation.medium,
    padding: theme.s5,
    display: "grid",
    gap: theme.s3,
  }),
  confirmTitle: css({ ...font.boldH5_20, margin: 0, color: color.neutral900 }),
  confirmText: css({ ...font.regular14, margin: 0, color: color.neutral700 }),
  confirmMeta: css({ ...font.regular13, margin: 0, color: color.genz.purple }),
  confirmActions: css({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.s2,
  }),
  notice: css({
    ...font.regular14,
    color: color.genz.purple,
    background: color.genz.purpleDim,
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
  }),
  info: css({ ...font.regular14, color: color.neutral700 }),
}
