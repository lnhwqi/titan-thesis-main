import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as ReportAction from "../Action/Report"
import * as UserReportCreateApi from "../Api/Auth/User/Report/Create"
import { reportTitleFromCategory, ReportCategory } from "../../../Core/App/Report"

type Props = { state: State }

const CATEGORIES: ReportCategory[] = [
  "WRONG_ITEM",
  "DEFECTIVE",
  "ITEM_NOT_RECEIVED",
  "FALSE_CLAIM",
]

export default function UserReportCreatePage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return <div className={styles.info}>Please login as user first.</div>
  }

  const route = state.route
  if (route._t !== "UserReportCreate") {
    return <div className={styles.info}>Invalid route.</div>
  }

  const form = state.report.createDraft
  const category = form.category
  const title = reportTitleFromCategory(category)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Report Product</h1>
      <p className={styles.meta}>Order: {route.params.orderID}</p>

      <label className={styles.label}>Category</label>
      <select
        className={styles.input}
        value={form.category}
        onChange={(e) => {
          const nextCategory = parseReportCategory(e.currentTarget.value)
          if (nextCategory != null) {
            emit(ReportAction.onChangeCreateDraftCategory(nextCategory))
          }
        }}
      >
        {CATEGORIES.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <label className={styles.label}>Description</label>
      <textarea
        className={styles.textarea}
        value={form.userDescription}
        onChange={(e) => emit(ReportAction.onChangeCreateDraftDescription(e.currentTarget.value))}
      />

      <label className={styles.label}>Evidence Image URLs (one per line)</label>
      <textarea
        className={styles.textarea}
        value={form.userUrlImgsRaw}
        onChange={(e) => emit(ReportAction.onChangeCreateDraftUrls(e.currentTarget.value))}
      />

      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
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
              emit(ReportAction.submitUserReport(decoded.value))
            } else {
              emit(ReportAction.setFlashMessage("Invalid report input."))
            }
          }}
        >
          Submit Report
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(navigateTo(toRoute("UserOrders", {})))}
        >
          Cancel
        </button>
      </div>

      {state.report.flashMessage != null ? (
        <div className={styles.notice}>{state.report.flashMessage}</div>
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
  page: css({ padding: theme.s6, display: "grid", gap: theme.s2, maxWidth: "760px" }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  meta: css({ ...font.regular14, color: color.neutral700 }),
  label: css({ ...font.medium14, color: color.secondary500 }),
  input: css({ border: `1px solid ${color.secondary300}`, borderRadius: theme.s2, padding: theme.s2 }),
  textarea: css({ border: `1px solid ${color.secondary300}`, borderRadius: theme.s2, padding: theme.s2, minHeight: "100px" }),
  actions: css({ display: "flex", gap: theme.s2 }),
  primaryButton: css({ border: "none", background: color.secondary500, color: color.neutral0, borderRadius: theme.s2, padding: `${theme.s2} ${theme.s3}`, cursor: "pointer" }),
  secondaryButton: css({ border: `1px solid ${color.secondary300}`, background: color.neutral0, color: color.secondary500, borderRadius: theme.s2, padding: `${theme.s2} ${theme.s3}`, cursor: "pointer" }),
  info: css({ ...font.regular14, color: color.neutral700 }),
  notice: css({ ...font.regular14, color: color.secondary500 }),
}
