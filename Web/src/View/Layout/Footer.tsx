import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"

import { font, theme } from "../Theme"

type Props = {
  state: State
}

export default function Footer(_props: Props): JSX.Element {
  return (
    <footer className={styles.container}>
      <div className={styles.wrap}>
        <div className={styles.brandBlock}>
          <h5 className={styles.brandLink}>
            Titan Ecommerce - Thesis course Project - Not use for commerce
          </h5>
          <p className={styles.copy}>Contact: lengochuy.hwqiat@gmail.com</p>
        </div>
      </div>
    </footer>
  )
}

const styles = {
  container: css({
    marginTop: "auto",
    position: "sticky",
    bottom: 0,
    zIndex: 18,
    background: "var(--app-surface)",
    backdropFilter: "blur(18px)",
    borderTop: "1px solid var(--app-border)",
    boxShadow: "var(--app-shadow-xs)",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "2px",
      background:
        "linear-gradient(90deg, var(--app-secondary-500) 0%, var(--app-brand-500) 100%)",
      opacity: 0.85,
    },
    "@media (max-width: 760px)": {
      paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))",
    },
  }),
  wrap: css({
    width: "min(100%, 1280px)",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.s4,
    padding: `clamp(8px, 2vw, 14px) clamp(12px, 2.8vw, 28px)`,
    "@media (max-width: 900px)": {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      textAlign: "center",
    },
  }),
  brandBlock: css({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    width: "100%",
    alignItems: "center",
  }),
  brandLink: css({
    ...font.medium12,
    letterSpacing: "0.02em",
    textTransform: "none",
    textDecoration: "none",
    color: "var(--app-accent)",
    width: "100%",
    lineHeight: 1.35,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    margin: 0,
    transition: "opacity 160ms ease",
    "&:hover": {
      opacity: 0.84,
    },
    "@media (max-width: 760px)": {
      ...font.regular12,
    },
  }),
  copy: css({
    ...font.regular12,
    margin: 0,
    color: "var(--app-text-soft)",
    lineHeight: 1.35,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    "@media (max-width: 760px)": {
      ...font.regular12,
    },
  }),
}
