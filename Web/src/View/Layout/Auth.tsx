import { css } from "@emotion/css"
import { AuthState } from "../../State"
import { JSX } from "react"
import Header from "./Header"
import { appThemeClass, color, theme, layoutSize } from "../Theme"

type Props = { authState: AuthState; Page: React.FC<{ authState: AuthState }> }
export function AuthLayout(props: Props): JSX.Element {
  const { authState, Page } = props

  return (
    <div className={`${appThemeClass} ${styles.container}`}>
      <div className={styles.header}>
        <div className={styles.headerWrap}>
          <Header state={authState} />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.bodyWrap}>
          <Page authState={authState} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: css({
    width: "100%",
    maxWidth: "100%",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
  }),
  header: css({
    display: "flex",
    justifyContent: "center",
    backgroundColor: theme.color.neutral0,
    position: "sticky",
    top: 0,
    zIndex: 20,
  }),
  headerWrap: css({
    width: "100%",
    maxWidth: layoutSize.maxWidth,
  }),
  body: css({
    height: "100%",
    display: "flex",
    justifyContent: "center",
    overflowY: "auto",
    backgroundColor: color.genz.purple20,
  }),
  bodyWrap: css({
    width: "100%",
    maxWidth: layoutSize.maxWidth,
  }),
}
