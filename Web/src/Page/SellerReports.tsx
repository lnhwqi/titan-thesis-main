import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as ReportAction from "../Action/Report"
import { navigateTo, toRoute } from "../Route"
import { ReportStatus } from "../../../Core/App/Report"
import * as AuthToken from "../App/AuthToken"

type Props = { state: State }

export default function SellerReportsPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return <div className={styles.info}>Please login as seller first.</div>
  }

  const isSubmitting = state.report.sellerRespondResponse._t === "Loading"

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Seller Reports</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(ReportAction.onEnterSellerReportsRoute())}
          >
            Refresh
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
          >
            Back Dashboard
          </button>
        </div>
      </div>

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
          const canSubmitEvidence = canSellerSubmitEvidence(report.status)
          const canAgreeCashback = canSellerAgreeCashback(report.status)
          const evidenceDescription =
            state.report.sellerEvidenceDraftByReportID[id] ?? ""
          const evidenceUrlsRaw =
            state.report.sellerEvidenceUrlsDraftByReportID[id] ?? ""
          const hasEvidenceInput =
            evidenceDescription.trim() !== "" ||
            evidenceUrlsRaw
              .split(/\r?\n/)
              .map((v) => v.trim())
              .some((v) => v !== "")

          return (
            <article
              key={id}
              className={styles.card}
            >
              <div>ID: {id}</div>
              <div>Order ID: {report.orderID.unwrap()}</div>
              <div>Category: {report.category}</div>
              <div>Title: {report.title}</div>
              <div>Status: {humanizeStatus(report.status)}</div>

              <div className={styles.sectionTitle}>User Claim</div>
              <div>User Description: {report.userDescription.unwrap()}</div>
              <div>
                User Images:{" "}
                {report.userUrlImgs.map((i) => i.unwrap()).join(", ") || "-"}
              </div>

              <div className={styles.sectionTitle}>Your Response</div>
              <div>
                Seller Description: {report.sellerDescription?.unwrap() ?? "-"}
              </div>
              <div>
                Seller Images:{" "}
                {report.sellerUrlImgs.map((i) => i.unwrap()).join(", ") || "-"}
              </div>

              <div className={styles.sectionTitle}>Admin Decision</div>
              <div>Admin Result: {report.resultTextAdmin?.unwrap() ?? "-"}</div>

              <textarea
                className={styles.textarea}
                placeholder="Seller evidence description"
                value={evidenceDescription}
                onChange={(e) =>
                  emit(
                    ReportAction.onChangeSellerEvidenceDraft(
                      id,
                      e.currentTarget.value,
                    ),
                  )
                }
              />
              <textarea
                className={styles.textarea}
                placeholder="Seller evidence image URLs (one per line)"
                value={evidenceUrlsRaw}
                onChange={(e) =>
                  emit(
                    ReportAction.onChangeSellerEvidenceUrlsDraft(
                      id,
                      e.currentTarget.value,
                    ),
                  )
                }
              />

              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  disabled={
                    isSubmitting ||
                    canSubmitEvidence === false ||
                    hasEvidenceInput === false
                  }
                  onClick={() => emit(ReportAction.submitSellerEvidence(id))}
                >
                  Send Evidence
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={isSubmitting || canAgreeCashback === false}
                  onClick={() => emit(ReportAction.approveSellerRefund(id))}
                >
                  Agree Cashback
                </button>
              </div>
              <div className={styles.hint}>
                {sellerHint(report.status, hasEvidenceInput)}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function canSellerSubmitEvidence(status: ReportStatus): boolean {
  return status === "OPEN" || status === "UNDER_REVIEW"
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

function sellerHint(status: ReportStatus, hasEvidenceInput: boolean): string {
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

  if (hasEvidenceInput === false) {
    return "Add evidence text or image URLs to enable Send Evidence."
  }

  return "You can send evidence or agree cashback based on your decision."
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
  card: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    padding: theme.s3,
    display: "grid",
    gap: theme.s1,
    background: color.neutral0,
    ...font.regular14,
  }),
  sectionTitle: css({
    ...font.bold14,
    marginTop: theme.s1,
    color: color.neutral800,
  }),
  actions: css({ display: "flex", gap: theme.s2 }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
    width: "fit-content",
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
  }),
  hint: css({ ...font.regular13, color: color.neutral700 }),
  textarea: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    minHeight: "80px",
  }),
  notice: css({ ...font.regular14, color: color.secondary500 }),
  info: css({ ...font.regular14, color: color.neutral700 }),
}
