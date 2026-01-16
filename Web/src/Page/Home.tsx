import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"

export type HomePageProps = { state: AuthState | PublicState }
export default function HomePage(props: HomePageProps): JSX.Element {
  const { state } = props

  const userName = state._t === "Auth" ? state.profile.name.unwrap() : "Guest"

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Welcome, {userName}!</h1>

      <div className={styles.pageContent}>
        {state._t === "Auth" ? (
          <>Đây là dữ liệu của người dùng thật được lấy từ API Home.</>
        ) : (
          <>Vui lòng đăng nhập.</>
        )}
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
}
