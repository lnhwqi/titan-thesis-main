import { css } from "@emotion/css"
import { JSX } from "react"
import Link from "../Link"
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { State } from "../../State"

type Props = {
  state: State
}

export default function SubHeader(props: Props): JSX.Element {
  const { state } = props
  const isAuthUser = state._t === "AuthUser"
  const rootCategories =
    state.category.treeResponse._t === "Success" ? state.category.treeResponse.data : []

  return (
    <div className={styles.navContainer}>
      <Link
        route={isAuthUser ? toRoute("Saved", {}) : toRoute("Login", { redirect: "/saved" })}
        className={styles.navLink}
      >
        Saved
      </Link>

      {rootCategories.map((category) => (
        <Link
          key={category.id.unwrap()}
          route={toRoute("Category", { id: category.id.unwrap() })}
          className={styles.navLink}
        >
          {category.name.unwrap()}
        </Link>
      ))}
    </div>
  )
}

const styles = {
  navContainer: css({
    display: "flex",
    gap: theme.s6,
    padding: `${theme.s2} ${theme.s8}`,
    borderBottom: `1px solid ${color.secondary100}`,
    background: color.neutral0,
    alignItems: "center",
    justifyContent: "center",
    overflowX: "auto",
  }),
  navLink: css({
    ...font.regular12,
    color: color.neutral800,
    textDecoration: "none",
    whiteSpace: "nowrap",
    "&:hover": {
      color: color.primary500,
    },
  }),
}
