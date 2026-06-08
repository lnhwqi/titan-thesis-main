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
        {/* Brand column */}
        <div className={styles.brandBlock}>
          <span className={styles.brandName}>TITAN E-Commerce</span>
          <p className={styles.descript}>
            Design and Development of a Type Safe Ecommerce Platform Integrated
            with an AI Chat Assistant
          </p>
          <p className={styles.copy}>© 2026 Titan — Thesis Project Demo</p>
        </div>

        {/* Contact column */}
        <div className={styles.linkBlock}>
          <span className={styles.linkHeading}>Contact</span>
          <p className={styles.link}>lengochuy.hwqiat@gmail.com</p>
          <p className={styles.noteText}>Not for commercial use</p>
        </div>
      </div>
    </footer>
  )
}

const styles = {
  container: css({
    position: "relative",
    // marginTop: "auto",
    // position: "sticky",
    // bottom: 0,
    zIndex: 18,
    background: "var(--app-surface)",
    backdropFilter: "blur(20px)",
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
        "linear-gradient(90deg, var(--app-secondary-500) 0%, var(--app-brand-500) 50%, var(--app-secondary-500) 100%)",
      opacity: 0.9,
    },
    "@media (max-width: 760px)": {
      paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))",
    },
  }),
  wrap: css({
    width: "min(100%, 1280px)",
    margin: "0 auto",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.s8,
    padding: `clamp(14px, 2.4vw, 22px) clamp(16px, 3vw, 32px)`,
    "@media (max-width: 760px)": {
      flexDirection: "column",
      gap: theme.s5,
      alignItems: "flex-start",
    },
  }),
  brandBlock: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    flex: "0 0 auto",
    minWidth: 0,
  }),
  brandName: css({
    ...font.bold14,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    background:
      "linear-gradient(135deg, var(--app-brand-500) 0%, var(--app-secondary-500) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }),
  descript: css({
    margin: 0,
    ...font.regular12,
    color: "var(--app-text-soft)",
    lineHeight: 1.5,
  }),
  copy: css({
    ...font.regular12,
    margin: 0,
    color: "var(--app-text-muted)",
    marginTop: theme.s1,
  }),
  linkBlock: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    flex: "0 0 auto",
  }),
  linkHeading: css({
    ...font.bold12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--app-text-muted)",
    marginBottom: "2px",
  }),
  link: css({
    margin: 0,
    textDecoration: "none",
    ...font.regular12,
    color: "var(--app-text-soft)",
    transition: "color 0.18s ease",
    cursor: "pointer",
    "&:hover": {
      color: "var(--app-accent)",
    },
  }),
  noteText: css({
    margin: 0,
    ...font.regular12,
    color: "var(--app-text-muted)",
    fontStyle: "italic",
  }),
}
