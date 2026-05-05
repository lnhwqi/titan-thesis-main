import { JSX, ReactNode } from "react"
import { css } from "@emotion/css"
import { bp, color, font, theme } from "../Theme"
import Button from "../Form/Button"
import { emit } from "../../Runtime/React"
import { navigateTo, toRoute } from "../../Route"

// ---------------------------------------------------------------------------
// AuthPageShell
// Consistent outer container for all authenticated user pages.
// Provides background, padding, and a centred max-width shell.
// ---------------------------------------------------------------------------

type ShellProps = { children: ReactNode }

export function AuthPageShell(props: ShellProps): JSX.Element {
  return (
    <div className={shellStyles.page}>
      <div className={shellStyles.shell}>{props.children}</div>
    </div>
  )
}

const shellStyles = {
  page: css({
    minHeight: "100dvh",
    padding: `${theme.s5} ${theme.s3}`,
    background: [
      `radial-gradient(circle at 8% 12%, ${color.secondary10} 0%, transparent 40%)`,
      `radial-gradient(circle at 88% 10%, rgba(0, 82, 156, 0.08) 0%, transparent 32%)`,
      `linear-gradient(180deg, var(--app-bg, ${color.secondary10}) 0%, #eef5fb 100%)`,
    ].join(", "),
    ...bp.md({
      padding: `${theme.s8} ${theme.s6}`,
    }),
  }),
  shell: css({
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: theme.s5,
    ...bp.md({
      gap: theme.s6,
    }),
  }),
}

// ---------------------------------------------------------------------------
// AuthPageHeader
// Consistent page title + optional subtitle for every protected page.
// ---------------------------------------------------------------------------

type HeaderProps = {
  title: string
  subtitle?: string
}

export function AuthPageHeader(props: HeaderProps): JSX.Element {
  return (
    <div className={headerStyles.root}>
      <h1 className={headerStyles.title}>{props.title}</h1>
      {props.subtitle != null ? (
        <p className={headerStyles.subtitle}>{props.subtitle}</p>
      ) : null}
      <div className={headerStyles.accent} />
    </div>
  )
}

const headerStyles = {
  root: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  title: css({
    ...font.boldH3_29,
    margin: 0,
    color: color.secondary500,
  }),
  subtitle: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral600,
  }),
  accent: css({
    width: "36px",
    height: "3px",
    borderRadius: "2px",
    background: `linear-gradient(90deg, ${color.secondary500}, ${color.primary500})`,
    marginTop: theme.s1,
  }),
}

// ---------------------------------------------------------------------------
// AuthPageCard
// White card used as the main content surface inside a page.
// ---------------------------------------------------------------------------

type CardProps = { children: ReactNode }

export function AuthPageCard(props: CardProps): JSX.Element {
  return <div className={cardStyles.root}>{props.children}</div>
}

const cardStyles = {
  root: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.br2,
    padding: theme.s6,
    boxShadow: "0 4px 16px rgba(0, 82, 156, 0.07)",
  }),
}

// ---------------------------------------------------------------------------
// AuthGateCard
// Shown when the page requires login but the user is not authenticated.
// ---------------------------------------------------------------------------

type GateProps = {
  title: string
  message: string
  /** The path to redirect back to after login, e.g. "/profile" */
  loginRedirect: string
}

export function AuthGateCard(props: GateProps): JSX.Element {
  return (
    <div className={gateStyles.wrapper}>
      <div className={gateStyles.card}>
        <div className={gateStyles.announceWrapper}>
          <span className={gateStyles.announce}>Prohibit</span>
        </div>
        <div className={gateStyles.body}>
          <h2 className={gateStyles.title}>{props.title}</h2>
          <p className={gateStyles.message}>{props.message}</p>
        </div>
        <div className={gateStyles.action}>
          <Button
            theme_={"Blue"}
            size={"M"}
            label={"Go to Login"}
            onClick={() =>
              emit(
                navigateTo(toRoute("Login", { redirect: props.loginRedirect })),
              )
            }
          />
        </div>
      </div>
    </div>
  )
}

const gateStyles = {
  wrapper: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    padding: theme.s4,
  }),
  card: css({
    width: "100%",
    maxWidth: "440px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.br2,
    boxShadow: "0 12px 40px rgba(0, 82, 156, 0.10)",
    padding: theme.s8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s4,
    textAlign: "center",
  }),
  announceWrapper: css({
    padding: theme.s3,
    borderRadius: "5%",
    background: color.secondary20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  announce: css({
    fontSize: "24px",
    color: color.primary200,
  }),
  body: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  title: css({
    ...font.boldH5_20,
    margin: 0,
    color: color.secondary500,
  }),
  message: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral600,
  }),
  action: css({
    width: "100%",
    maxWidth: "200px",
  }),
}
