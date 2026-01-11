import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"

export type HomePageProps = { state: AuthState | PublicState }
export default function HomePage(_props: HomePageProps): JSX.Element {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Lorem Ipsum</h1>
      <div className={styles.pageContent}>
          <>Huy</>
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
