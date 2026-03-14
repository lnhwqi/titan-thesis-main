import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as RegisterAction from "../Action/Register"
import ProductList from "../View/Part/ProductList"
export type HomePageProps = { state: AuthState | PublicState }
export default function HomePage(props: HomePageProps): JSX.Element {
  const { state } = props
  const registerStatus = state.register.status
  const hasAnnouncement = registerStatus._t === "Success"

  return (
    <div className={styles.container}>
      {hasAnnouncement ? (
        <div className={styles.announcementCard}>
          <div className={styles.announcementTitle}>Registration Submitted</div>
          <div className={styles.announcementBody}>
            {registerStatus.message}
          </div>
          <button
            className={styles.announcementClose}
            onClick={() => emit(RegisterAction.clearStatus())}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className={styles.pageContent}>
        <ProductList state={state} />
      </div>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    padding: `${theme.s0} ${theme.s4}`,
    ...bp.xl({
      padding: theme.s0,
    }),
  }),
  pageTitle: css({
    ...font.boldH1_42,
    color: color.secondary500,
  }),
  pageContent: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  announcementCard: css({
    margin: `${theme.s4} 0`,
    padding: theme.s4,
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary50,
    boxShadow: theme.elevation.medium,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  announcementTitle: css({
    ...font.bold14,
    color: color.secondary500,
  }),
  announcementBody: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  announcementClose: css({
    width: "fit-content",
    border: `1px solid ${color.secondary400}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    color: color.secondary500,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
  }),
}
