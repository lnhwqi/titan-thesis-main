import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as ReportAction from "../Action/Report"

type Props = { state: State }

export default function UserReportsPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return <div className={styles.info}>Please login as user first.</div>
  }

  const reports = state.report.userReports

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>My Reports</h1>
        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(ReportAction.onEnterUserReportsRoute())}
          >
            Refresh
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("UserOrders", {})))}
          >
            Back Orders
          </button>
        </div>
      </div>

      {state.report.flashMessage != null ? (
        <div className={styles.notice}>{state.report.flashMessage}</div>
      ) : null}

      {state.report.userReportsResponse._t === "Loading" ? (
        <div className={styles.info}>Loading reports...</div>
      ) : null}

      {reports.length === 0 && state.report.userReportsResponse._t === "Success" ? (
        <div className={styles.info}>No reports yet.</div>
      ) : null}

      <div className={styles.list}>
        {reports.map((report) => (
          <article
            key={report.id.unwrap()}
            className={styles.card}
          >
            <div>ID: {report.id.unwrap()}</div>
            <div>Order ID: {report.orderID.unwrap()}</div>
            <div>Seller ID: {report.sellerID.unwrap()}</div>
            <div>User ID: {report.userID.unwrap()}</div>
            <div>Category: {report.category}</div>
            <div>Title: {report.title}</div>
            <div>Status: {report.status}</div>
            <div>User Description: {report.userDescription.unwrap()}</div>
            <div>
              User Images:
              <ul>
                {report.userUrlImgs.map((img, idx) => (
                  <li key={`${report.id.unwrap()}-u-${idx}`}>{img.unwrap()}</li>
                ))}
              </ul>
            </div>
            <div>
              Seller Description: {report.sellerDescription?.unwrap() ?? "-"}
            </div>
            <div>
              Seller Images:
              <ul>
                {report.sellerUrlImgs.map((img, idx) => (
                  <li key={`${report.id.unwrap()}-s-${idx}`}>{img.unwrap()}</li>
                ))}
              </ul>
            </div>
            <div>Admin Result: {report.resultTextAdmin?.unwrap() ?? "-"}</div>
          </article>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: css({ padding: theme.s6 }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  headerRow: css({
    display: "flex",
    justifyContent: "space-between",
    gap: theme.s2,
    alignItems: "center",
    marginBottom: theme.s3,
  }),
  actions: css({ display: "flex", gap: theme.s2 }),
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
  info: css({ ...font.regular14, color: color.neutral700 }),
  notice: css({ ...font.regular14, color: color.secondary500 }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
