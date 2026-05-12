import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as ReportAction from "../Action/Report"
import * as UserReportCreateApi from "../Api/Auth/User/Report/Create"
import {
  reportTitleFromCategory,
  ReportCategory,
} from "../../../Core/App/Report"

type Props = { state: State }

const CATEGORIES: ReportCategory[] = [
  "WRONG_ITEM",
  "DEFECTIVE",
  "ITEM_NOT_RECEIVED",
  "FALSE_CLAIM",
]

export default function UserReportCreatePage(props: Props): JSX.Element {
  const { state } = props

  if (!("updateProfile" in state)) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Authentication Required</h1>
          <p className={styles.gateText}>
            Please login to create a product report.
          </p>
          <div className={styles.gateActions}>
            <button
              className={styles.secondaryButton}
              onClick={() =>
                emit(navigateTo(toRoute("Login", { redirect: "/reports" })))
              }
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  const route = state.route
  if (route._t !== "UserReportCreate") {
    return <div className={styles.info}>Invalid route.</div>
  }

  const form = state.report.createDraft
  const category = form.category
  const title = reportTitleFromCategory(category)
  const isSubmitting = state.report.createResponse._t === "Loading"
  const userConfirmState = state.report.userCreateConfirmState

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Report Product</h1>
      <p className={styles.meta}>Order: {route.params.orderID}</p>

      <label className={styles.label}>Category</label>
      <select
        className={styles.input}
        disabled={isSubmitting}
        value={form.category}
        onChange={(e) => {
          const nextCategory = parseReportCategory(e.currentTarget.value)
          if (nextCategory != null) {
            emit(ReportAction.onChangeCreateDraftCategory(nextCategory))
          }
        }}
      >
        {CATEGORIES.map((item) => (
          <option
            key={item}
            value={item}
          >
            {item}
          </option>
        ))}
      </select>

      <label className={styles.label}>Description</label>
      <textarea
        className={styles.textarea}
        disabled={isSubmitting}
        value={form.userDescription}
        onChange={(e) =>
          emit(
            ReportAction.onChangeCreateDraftDescription(e.currentTarget.value),
          )
        }
      />

      <label className={styles.label}>Evidence Image URLs (one per line)</label>
      <textarea
        className={styles.textarea}
        disabled={isSubmitting}
        value={form.userUrlImgsRaw}
        onChange={(e) =>
          emit(ReportAction.onChangeCreateDraftUrls(e.currentTarget.value))
        }
      />

      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
          disabled={isSubmitting}
          onClick={() => {
            const decoded = UserReportCreateApi.paramsDecoder.decode({
              sellerID: route.params.sellerID,
              orderID: route.params.orderID,
              category,
              title,
              userDescription: form.userDescription,
              userUrlImgs: form.userUrlImgsRaw
                .split(/\r?\n/)
                .map((v) => v.trim())
                .filter((v) => v !== ""),
            })

            if (decoded.ok) {
              emit(ReportAction.openUserCreateConfirm(decoded.value))
            } else {
              emit(ReportAction.setFlashMessage("Invalid report input."))
            }
          }}
        >
          Submit Report
        </button>
        <button
          className={styles.secondaryButton}
          disabled={isSubmitting}
          onClick={() => emit(navigateTo(toRoute("UserOrders", {})))}
        >
          Cancel
        </button>
      </div>

      {state.report.flashMessage != null ? (
        <div className={styles.notice}>{state.report.flashMessage}</div>
      ) : null}

      {userConfirmState != null ? (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <h3 className={styles.confirmTitle}>Confirm Report Submission</h3>
            <p className={styles.confirmText}>
              You can submit this report only once for this order stage. Confirm
              to submit and return to your orders page.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.secondaryButton}
                disabled={isSubmitting}
                onClick={() => emit(ReportAction.closeUserCreateConfirm())}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={isSubmitting}
                onClick={() => emit(ReportAction.confirmUserCreateReport())}
              >
                {isSubmitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function parseReportCategory(value: string): ReportCategory | null {
  switch (value) {
    case "WRONG_ITEM":
    case "DEFECTIVE":
    case "ITEM_NOT_RECEIVED":
    case "FALSE_CLAIM":
      return value
    default:
      return null
  }
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    display: "grid",
    gap: theme.s2,
    maxWidth: "760px",
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
  }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  meta: css({ ...font.regular14, color: color.neutral700 }),
  label: css({ ...font.medium14, color: color.genz.purple }),
  input: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
  }),
  textarea: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    minHeight: "100px",
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
  }),
  actions: css({ display: "flex", gap: theme.s2 }),
  primaryButton: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
  }),
  gate: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "480px",
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    padding: theme.s6,
    background: color.neutral0,
    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.08)",
    display: "grid",
    gap: theme.s2,
  }),
  gateTitle: css({
    ...font.boldH5_20,
    margin: 0,
    color: color.genz.purple,
  }),
  gateText: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral700,
  }),
  gateActions: css({
    marginTop: theme.s1,
    display: "flex",
  }),
  info: css({ ...font.regular14, color: color.neutral700 }),
  notice: css({ ...font.regular14, color: color.genz.purple }),
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
    borderRadius: theme.s2,
    border: `1px solid ${color.genz.purple100}`,
    boxShadow: theme.elevation.medium,
    padding: theme.s4,
    display: "grid",
    gap: theme.s2,
  }),
  confirmTitle: css({ ...font.boldH5_20, margin: 0, color: color.neutral900 }),
  confirmText: css({ ...font.regular14, margin: 0, color: color.neutral700 }),
  confirmActions: css({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.s2,
  }),
}
