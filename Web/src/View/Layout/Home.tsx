import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { color } from "../Theme"
import Header from "./Header"
import SubHeader from "./SubHeader"
import CategorySidebar from "./Category"
import { CartSidebar } from "../Part/Cart"
type Props = {
  state: State
  Page: React.FC<{ state: State }>
}
// Web/src/View/Layout/Home.tsx

export function HomeLayout(props: Props): JSX.Element {
  const { state, Page } = props
  return (
    <div className={styles.container}>
      <Header state={state} />
      <SubHeader />
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <CategorySidebar state={state} />
        </aside>
        <main className={styles.mainContent}>
          <Page state={state} />
        </main>
      </div>

      <CartSidebar state={props.state} />
    </div>
  )
}

const styles = {
  container: css({
    width: "100dvw",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
  }),
  body: css({
    display: "flex",
    flex: 1,
    overflow: "hidden",
  }),
  sidebar: css({
    width: "260px",
    flexShrink: 0,
    borderRight: `1px solid ${color.neutral0}`,
    overflowY: "auto",
  }),
  mainContent: css({
    flex: 1,
    overflowY: "auto",
    backgroundColor: color.neutral0,
  }),
}
