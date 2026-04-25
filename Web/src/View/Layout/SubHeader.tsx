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
    gap: "6px",
    padding: `${theme.s2} ${theme.s8}`,
    borderBottom: `1px solid rgba(124, 58, 237, 0.1)`,
    background: `linear-gradient(90deg, rgba(124, 58, 237, 0.03) 0%, rgba(255,255,255,1) 50%, rgba(236, 72, 153, 0.03) 100%)`,
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
    padding: `${theme.s1} ${theme.s3}`,
    borderRadius: "20px",
    border: `1.5px solid transparent`,
    transition: "all 0.2s ease",
    "&:hover": {
      color: color.genz.purple,
      backgroundColor: "rgba(124, 58, 237, 0.07)",
      borderColor: "rgba(124, 58, 237, 0.25)",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  }),
}
