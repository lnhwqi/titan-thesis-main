import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as RegisterAction from "../Action/Register"
import { navigateTo, toRoute } from "../Route"
import ProductList from "../View/Part/ProductList"
import { fadeSlideUp } from "../View/Theme/Keyframe"

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
  pageContent: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  announcementOverlay: css({
    position: "fixed",
    inset: 0,
    zIndex: 999,
    background: "rgba(15, 15, 26, 0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s4,
  }),
  announcementCard: css({
    width: "100%",
    maxWidth: "min(100%, 440px)",
    padding: theme.s6,
    borderRadius: theme.br4,
    border: "1px solid var(--app-border)",
    background: "var(--app-surface-strong)",
    backdropFilter: "blur(20px)",
    boxShadow: "var(--app-shadow-lg)",
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    animation: `${fadeSlideUp} 0.3s ease both`,
  }),
  announcementTitle: css({
    ...font.bold17,
    color: color.neutral900,
    margin: 0,
  }),
  announcementBody: css({
    ...font.regular14,
    color: color.neutral600,
    lineHeight: 1.6,
  }),
  announcementActions: css({
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
    marginTop: theme.s1,
  }),
  announcementClose: css({
    flex: 1,
    border: "1px solid var(--app-border-strong)",
    borderRadius: theme.br3,
    background: "transparent",
    color: "var(--app-accent)",
    ...font.medium14,
    padding: `${theme.s2} ${theme.s4}`,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "var(--app-brand-20)",
      borderColor: "var(--app-brand-400)",
    },
  }),
  announcementLogin: css({
    flex: 1,
    border: "none",
    borderRadius: theme.br3,
    background:
      "linear-gradient(135deg, var(--app-brand-500) 0%, var(--app-secondary-500) 100%)",
    color: color.neutral0,
    ...font.medium14,
    padding: `${theme.s2} ${theme.s4}`,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: theme.elevation.small,
    "&:hover": {
      filter: "brightness(1.1)",
      transform: "translateY(-1px)",
      boxShadow: theme.elevation.medium,
    },
  }),
}
