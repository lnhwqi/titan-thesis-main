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
    state.category.treeResponse._t === "Success"
      ? state.category.treeResponse.data
      : []

  return (
    <div className={styles.navContainer}>
      <Link
        route={
          isAuthUser
            ? toRoute("Saved", {})
            : toRoute("Login", { redirect: "/saved" })
        }
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
    gap: theme.s2,
    padding: `${theme.s3} ${theme.s6}`,
    borderBottom: `1px solid ${color.genz.purple100}`,
    background: "rgba(255,255,255,0.58)",
    backdropFilter: "blur(16px)",
    alignItems: "center",
    justifyContent: "center",
    overflowX: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
  }),
  navLink: css({
    ...font.medium12,
    color: color.neutral700,
    textDecoration: "none",
    whiteSpace: "nowrap",
    minHeight: theme.s10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `${theme.s2} ${theme.s4}`,
    borderRadius: theme.brFull,
    border: `1px solid transparent`,
    transition: "all 0.2s ease",
    "&:hover": {
      color: color.genz.purple,
      backgroundColor: color.genz.purple20,
      borderColor: color.genz.purple100,
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  }),
}
