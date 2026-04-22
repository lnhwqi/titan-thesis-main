import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
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
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to view reports.
          </p>
        </div>
      </div>
    )
  }

  const isUpdating = state.report.adminUpdateStatusResponse._t === "Loading"
  const monthOptions = getMonthOptions(state.report.adminReports)
  const filteredSortedReports = state.report.adminReports
    .filter((report) =>
      state.report.adminStatusFilter === "ALL"
        ? true
        : report.status === state.report.adminStatusFilter,
    )
    .filter((report) =>
      state.report.adminMonthFilter === "ALL"
        ? true
        : toMonthKey(report.createdAt) === state.report.adminMonthFilter,
    )
    .sort((a, b) => b.createdAt - a.createdAt)
  const confirmState = state.report.adminFinalStatusConfirmState

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Reports</h1>
          <p className={styles.subtitle}>Manage and resolve user reports.</p>
        </div>
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
      </header>

      {state.report.flashMessage != null ? (
        <div className={styles.notice}>{state.report.flashMessage}</div>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.filtersRow}>
          <select
            className={styles.input}
            value={state.report.adminStatusFilter}
            onChange={(e) => {
              const nextFilter = parseAdminStatusFilter(e.currentTarget.value)
              if (nextFilter != null) {
                emit(ReportAction.onChangeAdminStatusFilter(nextFilter))
              }
            }}
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((status) => (
              <option
                key={status}
                value={status}
              >
                {humanizeStatus(status)}
              </option>
            ))}
          </select>

          <select
            className={styles.input}
            value={state.report.adminMonthFilter}
            onChange={(e) => {
              const nextMonth = parseAdminMonthFilter(e.currentTarget.value)
              if (nextMonth != null) {
                emit(ReportAction.onChangeAdminMonthFilter(nextMonth))
              }
            }}
          >
            <option value="ALL">All Months</option>
            {monthOptions.map((option) => (
              <option
                key={option.key}
                value={option.key}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {state.report.adminReportsResponse._t === "Loading" ? (
          <div className={styles.info}>Loading reports...</div>
        ) : null}

        {state.report.adminReports.length === 0 &&
        state.report.adminReportsResponse._t === "Success" ? (
          <div className={styles.info}>No reports found.</div>
        ) : null}

        <div className={styles.list}>
          {filteredSortedReports.map((report) => {
            const id = report.id.unwrap()
            const isClosed =
              report.status === "REJECTED" ||
              report.status === "RESOLVED" ||
              report.status === "CASHBACK_COMPLETED"
            const nextStatusOptions = STATUSES.filter((status) =>
              canAdminTransition(report.status, status),
            )
            const selectedStatus =
              state.report.statusDraftByReportID[id] ?? report.status
            return (
              <article
                key={id}
                className={styles.card}
              >
                <div>ID: {id}</div>
                <div>Order ID: {report.orderID.unwrap()}</div>
                <div>User ID: {report.userID.unwrap()}</div>
                <div>Seller ID: {report.sellerID.unwrap()}</div>
                <div>Category: {report.category}</div>
                <div>Title: {report.title}</div>
                <div>Status: {humanizeStatus(report.status)}</div>
                <div>Date: {formatDayMonth(report.createdAt)}</div>
                <div>User Description: {report.userDescription.unwrap()}</div>
                <div>
                  User Images:{" "}
                  {report.userUrlImgs.map((i) => i.unwrap()).join(", ") || "-"}
                </div>
                <div>
                  Seller Description:{" "}
                  {report.sellerDescription?.unwrap() ?? "-"}
                </div>
                <div>
                  Seller Images:{" "}
                  {report.sellerUrlImgs.map((i) => i.unwrap()).join(", ") ||
                    "-"}
                </div>
                <div>
                  Admin Result: {report.resultTextAdmin?.unwrap() ?? "-"}
                </div>

                {isClosed ? (
                  <div className={styles.hint}>
                    This report is finalized and cannot be edited.
                  </div>
                ) : (
                  <>
                    <select
                      className={styles.input}
                      value={selectedStatus}
                      disabled={isUpdating}
                      onChange={(e) => {
                        const nextStatus = parseReportStatus(
                          e.currentTarget.value,
                        )
                        if (nextStatus != null) {
                          emit(ReportAction.onChangeStatusDraft(id, nextStatus))
                        }
                      }}
                    >
                      {nextStatusOptions.map((s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {humanizeStatus(s)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className={styles.textarea}
                      placeholder="Admin result text"
                      disabled={isUpdating}
                      value={state.report.adminResultDraftByReportID[id] ?? ""}
                      onChange={(e) =>
                        emit(
                          ReportAction.onChangeAdminResultDraft(
                            id,
                            e.currentTarget.value,
                          ),
                        )
                      }
                    />
                    <button
                      className={styles.primaryButton}
                      disabled={isUpdating}
                      onClick={() =>
                        emit(ReportAction.submitAdminUpdateStatus(id))
                      }
                    >
                      Update Status
                    </button>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {confirmState != null ? (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <h3 className={styles.confirmTitle}>Confirm Final Status</h3>
            <p className={styles.confirmText}>
              {confirmState.status === "RESOLVED"
                ? "Setting this report to Resolved will finalize it and lock further edits."
                : "Setting this report to Rejected will finalize it and lock further edits."}
            </p>
            <p className={styles.confirmMeta}>
              Report ID: {confirmState.reportID}
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.secondaryButton}
                disabled={isUpdating}
                onClick={() =>
                  emit(ReportAction.closeAdminFinalStatusConfirm())
                }
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={isUpdating}
                onClick={() => emit(ReportAction.confirmAdminFinalStatus())}
              >
                {isUpdating ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatDayMonth(value: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

function parseAdminStatusFilter(value: string): "ALL" | ReportStatus | null {
  if (value === "ALL") {
    return "ALL"
  }

  return parseReportStatus(value)
}

function parseAdminMonthFilter(value: string): "ALL" | string | null {
  if (value === "ALL") {
    return "ALL"
  }

  return /^\d{4}-\d{2}$/.test(value) ? value : null
}

function toMonthKey(value: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function getMonthOptions(
  reports: State["report"]["adminReports"],
): Array<{ key: string; label: string }> {
  const keys = Array.from(
    new Set(
      reports
        .map((report) => toMonthKey(report.createdAt))
        .filter((value) => value !== ""),
    ),
  ).sort((a, b) => b.localeCompare(a))

  return keys.map((key) => {
    const [year, month] = key.split("-")
    const date = new Date(Number(year), Number(month) - 1, 1)
    const label = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(date)

    return { key, label }
  })
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
    return (
      from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
    )
  }

  if (to === "CASHBACK_COMPLETED") {
    return from === "REFUND_APPROVED"
  }

  if (to === "RESOLVED") {
    return from === "UNDER_REVIEW" || from === "REFUND_APPROVED"
  }

  if (to === "REJECTED") {
    return (
      from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
    )
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
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.secondary100} 0%, transparent 34%),` +
      `radial-gradient(circle at 85% 12%, ${color.secondary200} 0%, transparent 30%),` +
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
    border: `1px solid ${color.secondary100}`,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  headerActions: css({ display: "flex", gap: theme.s2 }),
  list: css({ display: "grid", gap: theme.s2 }),
  filtersRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    marginBottom: theme.s4,
  }),
  card: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    padding: theme.s4,
    display: "grid",
    gap: theme.s2,
    background: color.neutral50,
    ...font.regular14,
  }),
  input: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  textarea: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: theme.s3,
    minHeight: "80px",
    ...font.regular14,
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
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
  hint: css({ ...font.regular13, color: color.neutral700 }),
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
    maxWidth: "520px",
    background: color.neutral0,
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary100}`,
    boxShadow: theme.elevation.large,
    padding: theme.s5,
    display: "grid",
    gap: theme.s2,
  }),
  confirmTitle: css({ ...font.boldH5_20, margin: 0, color: color.neutral900 }),
  confirmText: css({ ...font.regular14, margin: 0, color: color.neutral700 }),
  confirmMeta: css({ ...font.regular13, margin: 0, color: color.secondary500 }),
  confirmActions: css({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.s2,
    marginTop: theme.s2,
  }),
  notice: css({
    ...font.regular14,
    color: color.neutral0,
    background: color.secondary500,
    padding: `${theme.s2} ${theme.s4}`,
    borderRadius: theme.s2,
    marginBottom: theme.s4,
    width: "fit-content",
  }),
  info: css({
    ...font.regular14,
    color: color.neutral700,
    padding: theme.s4,
    textAlign: "center",
    background: color.neutral50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.secondary200}`,
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
    maxWidth: "480px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
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
}
