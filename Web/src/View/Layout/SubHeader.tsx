import { css } from "@emotion/css"
import { JSX } from "react"
import Link from "../Link"
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"

export default function SubHeader(): JSX.Element {
  const navItems = ["Saved", "Electronics", "Fashion", "Deals"]

  return (
    <div className={styles.navContainer}>
      {navItems.map((item) => (
        <Link
          key={item}
          route={toRoute("Home", {})}
          className={styles.navLink}
        >
          {item}
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
