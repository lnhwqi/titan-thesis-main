import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as ReportAction from "../Action/Report"
import { ReportStatus } from "../../../Core/App/Report"
import { navigateTo, toRoute } from "../Route"
import * as AuthToken from "../App/AuthToken"

type Props = { state: State }

const STATUSES: ReportStatus[] = [
  "OPEN",
  "SELLER_REPLIED",
  "UNDER_REVIEW",
  "REFUND_APPROVED",
  "CASHBACK_COMPLETED",
  "RESOLVED",
  "REJECTED",
]

export default function AdminReportsPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"

  if (!isAdmin) {
    return <div className={styles.info}>Please login as admin first.</div>
  }

  const isUpdating = state.report.adminUpdateStatusResponse._t === "Loading"

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Admin Reports</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(ReportAction.onEnterAdminReportsRoute())}
          >
            Refresh
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminDashboard", {})))}
          >
            Back Dashboard
          </button>
        </div>
      </div>

      {state.report.flashMessage != null ? (
        <div className={styles.notice}>{state.report.flashMessage}</div>
      ) : null}

      {state.report.adminReportsResponse._t === "Loading" ? (
        <div className={styles.info}>Loading reports...</div>
      ) : null}

      {state.report.adminReports.length === 0 &&
      state.report.adminReportsResponse._t === "Success" ? (
        <div className={styles.info}>No reports found.</div>
      ) : null}

      <div className={styles.list}>
        {state.report.adminReports.map((report) => {
          const id = report.id.unwrap()
          const nextStatusOptions = STATUSES.filter((status) =>
            canAdminTransition(report.status, status),
          )
          const selectedStatus =
            state.report.statusDraftByReportID[id] ?? report.status
          return (
            <article key={id} className={styles.card}>
              <div>ID: {id}</div>
              <div>Order ID: {report.orderID.unwrap()}</div>
              <div>User ID: {report.userID.unwrap()}</div>
              <div>Seller ID: {report.sellerID.unwrap()}</div>
              <div>Category: {report.category}</div>
              <div>Title: {report.title}</div>
              <div>Status: {humanizeStatus(report.status)}</div>
              <div>User Description: {report.userDescription.unwrap()}</div>
              <div>User Images: {report.userUrlImgs.map((i) => i.unwrap()).join(", ") || "-"}</div>
              <div>Seller Description: {report.sellerDescription?.unwrap() ?? "-"}</div>
              <div>Seller Images: {report.sellerUrlImgs.map((i) => i.unwrap()).join(", ") || "-"}</div>
              <div>Admin Result: {report.resultTextAdmin?.unwrap() ?? "-"}</div>

              <select className={styles.input} value={selectedStatus} onChange={(e) => {
                const nextStatus = parseReportStatus(e.currentTarget.value)
                if (nextStatus != null) {
                  emit(ReportAction.onChangeStatusDraft(id, nextStatus))
                }
              }}>
                {nextStatusOptions.map((s) => <option key={s} value={s}>{humanizeStatus(s)}</option>)}
              </select>
              <textarea className={styles.textarea} placeholder="Admin result text" value={state.report.adminResultDraftByReportID[id] ?? ""} onChange={(e) => emit(ReportAction.onChangeAdminResultDraft(id, e.currentTarget.value))} />
              <button className={styles.primaryButton} disabled={isUpdating} onClick={() => emit(ReportAction.submitAdminUpdateStatus(id))}>Update Status</button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function parseReportStatus(value: string): ReportStatus | null {
  switch (value) {
    case "OPEN":
    case "SELLER_REPLIED":
    case "UNDER_REVIEW":
    case "REFUND_APPROVED":
    case "CASHBACK_COMPLETED":
    case "RESOLVED":
    case "REJECTED":
      return value
    default:
      return null
  }
}

function canAdminTransition(from: ReportStatus, to: ReportStatus): boolean {
  if (
    from === "REJECTED" ||
    from === "RESOLVED" ||
    from === "CASHBACK_COMPLETED"
  ) {
    return from === to
  }

  if (to === "UNDER_REVIEW") {
    return from === "OPEN" || from === "SELLER_REPLIED"
  }

  if (to === "REFUND_APPROVED") {
    return from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
  }

  if (to === "CASHBACK_COMPLETED") {
    return from === "REFUND_APPROVED"
  }

  if (to === "RESOLVED") {
    return from === "UNDER_REVIEW" || from === "REFUND_APPROVED"
  }

  if (to === "REJECTED") {
    return from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
  }

  return from === to
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

const styles = {
  page: css({ padding: theme.s6, display: "grid", gap: theme.s2 }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  headerRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
  }),
  headerActions: css({ display: "flex", gap: theme.s2 }),
  list: css({ display: "grid", gap: theme.s2 }),
  card: css({ border: `1px solid ${color.secondary100}`, borderRadius: theme.s2, padding: theme.s3, display: "grid", gap: theme.s1, background: color.neutral0, ...font.regular14 }),
  input: css({ border: `1px solid ${color.secondary300}`, borderRadius: theme.s2, padding: theme.s2 }),
  textarea: css({ border: `1px solid ${color.secondary300}`, borderRadius: theme.s2, padding: theme.s2, minHeight: "80px" }),
  primaryButton: css({ border: "none", background: color.secondary500, color: color.neutral0, borderRadius: theme.s2, padding: `${theme.s2} ${theme.s3}`, cursor: "pointer", width: "fit-content", "&:disabled": { opacity: 0.6, cursor: "not-allowed" } }),
  secondaryButton: css({ border: `1px solid ${color.secondary300}`, background: color.neutral0, color: color.secondary500, borderRadius: theme.s2, padding: `${theme.s2} ${theme.s3}`, cursor: "pointer", width: "fit-content" }),
  notice: css({ ...font.regular14, color: color.secondary500 }),
  info: css({ ...font.regular14, color: color.neutral700 }),
}
