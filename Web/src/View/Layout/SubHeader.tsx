import { css } from "@emotion/css"
import { JSX } from "react"
import Link from "../Link"
import { toRoute } from "../../Route"
import { font, theme } from "../Theme"
import { State, isAuthUser } from "../../State"

type Props = {
  state: State
}

export default function SubHeader(props: Props): JSX.Element {
  const { state } = props
  const isUser = isAuthUser(state)
  const rootCategories =
    state.category.treeResponse._t === "Success"
      ? state.category.treeResponse.data
      : []

  return (
    <div className={styles.navContainer}>
      <Link
        route={
          isUser
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
    padding: `clamp(10px, 2vw, 14px) clamp(12px, 3vw, 28px)`,
    borderBottom: "1px solid var(--app-border)",
    background: "var(--app-surface)",
    backdropFilter: "blur(16px)",
    alignItems: "center",
    justifyContent: "flex-start",
    overflowX: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
    "@media (min-width: 768px)": {
      justifyContent: "center",
    },
  }),
  navLink: css({
    ...font.medium12,
    color: "var(--app-text-soft)",
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
      color: "var(--app-accent)",
      backgroundColor: "var(--app-brand-20)",
      borderColor: "var(--app-border)",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  }),
}
