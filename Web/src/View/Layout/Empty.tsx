import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { Chatbox } from "../Part/Chatbox"
import { appThemeClass } from "../Theme"

type Props = { state: State; Page: React.FC<{ state: State }> }
export function EmptyLayout(props: Props): JSX.Element {
  const { state, Page } = props
  return (
    <div className={`${appThemeClass} ${styles.container}`}>
      <Page state={state} />
      <Chatbox state={state} />
    </div>
  )
}

const styles = {
  container: css({
    width: "100%",
    maxWidth: "100%",
    minHeight: "100dvh",
    overflowX: "hidden",
  }),
}
