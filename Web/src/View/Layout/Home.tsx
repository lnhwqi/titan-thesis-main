import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import Header from "./Header"
import SubHeader from "./SubHeader"
type Props = {
  state: State
  Page: React.FC<{ state: State }>
}
export function HomeLayout(props: Props): JSX.Element {
  const { state, Page } = props
  return (
    <div className={styles.container}>
      <Header state={state} />
      <SubHeader />
      <Page state={state} />
    </div>
  )
}

const styles = {
  container: css({
    width: "100dvw",
    height: "100dvh",
  }),
}
