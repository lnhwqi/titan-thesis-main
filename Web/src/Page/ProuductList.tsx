import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as RegisterAction from "../Action/Register"
import { navigateTo, toRoute } from "../Route"
import ProductList from "../View/Part/ProductList"
export type HomePageProps = { state: AuthState | PublicState }
export default function HomePage(props: HomePageProps): JSX.Element {
  const { state } = props
  const registerStatus = state.register.status
  const hasAnnouncement = registerStatus._t === "Error"

  return (
    <div className={styles.container}>
      {hasAnnouncement ? (
        <div className={styles.announcementOverlay}>
          <div className={styles.announcementCard}>
            <div className={styles.announcementTitle}>
              Registration Submitted
            </div>
            <div className={styles.announcementBody}>
              {registerStatus.message}
            </div>
            <div className={styles.announcementActions}>
              <button
                className={styles.announcementClose}
                onClick={() => emit(RegisterAction.clearStatus())}
              >
                OK
              </button>
              <button
                className={styles.announcementLogin}
                onClick={() => {
                  emit(RegisterAction.clearStatus())
                  emit(navigateTo(toRoute("Login", { redirect: null })))
                }}
              >
                Login
              </button>
            </div>
          </div>
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
    color: color.genz.purple,
  }),
  pageContent: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  announcementOverlay: css({
    position: "fixed",
    inset: 0,
    zIndex: 999,
    background: "rgba(18, 24, 38, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s4,
  }),
  announcementCard: css({
    width: "100%",
    maxWidth: "440px",
    padding: theme.s4,
    borderRadius: theme.s3,
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    boxShadow: theme.elevation.large,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  announcementTitle: css({
    ...font.bold14,
    color: color.genz.purple,
  }),
  announcementBody: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  announcementActions: css({
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
  }),
  announcementClose: css({
    width: "fit-content",
    border: `1px solid ${color.genz.purpleLight}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    color: color.genz.purple,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
  }),
  announcementLogin: css({
    width: "fit-content",
    border: `1px solid ${color.genz.purple}`,
    borderRadius: theme.s2,
    background: color.genz.purple,
    color: color.neutral0,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
  }),
}
