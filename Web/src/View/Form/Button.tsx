import { JSX } from "react"
import { css } from "@emotion/css"
import { color, font, theme } from "../Theme"

type Theme = "Blue" | "Red" | "Green"

type Props = {
  theme_: Theme
  size: "L" | "M" | "S"
  label: string
  onClick: () => void
  disabled?: boolean
}
function View({ size, theme_, label, onClick, disabled }: Props): JSX.Element {
  const disabled_ = disabled || false
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={styles.container(size, theme_, disabled_)}
    >
      <div className={styles.label(size, theme_, disabled_)}>{label}</div>
    </button>
  )
}

function containerStyle(size: Props["size"]) {
  switch (size) {
    case "L":
      return {
        minHeight: theme.s14,
        gap: theme.s2,
        borderRadius: theme.br3,
        padding: `${theme.s2} ${theme.s6}`,
      }
    case "M":
      return {
        minHeight: theme.s12,
        gap: theme.s2,
        borderRadius: theme.br3,
        padding: `${theme.s2} ${theme.s5}`,
      }
    case "S":
      return {
        minHeight: theme.s10,
        gap: theme.s1,
        borderRadius: theme.br2,
        padding: `${theme.s1} ${theme.s4}`,
      }
  }
}

function containerColor(theme_: Props["theme_"], disabled: boolean) {
  if (disabled)
    return {
      backgroundColor: "var(--app-border)",
      boxShadow: "none",
      border: "1px solid var(--app-border)",
    }

  switch (theme_) {
    case "Blue":
      return {
        background:
          "linear-gradient(135deg, var(--app-brand-500) 0%, var(--app-secondary-500) 100%)",
        boxShadow: theme.elevation.small,
        border: "1px solid var(--app-brand-100)",
      }
    case "Red":
      return {
        background: color.semantics.error.red500,
        boxShadow: theme.elevation.small,
        border: `1px solid ${color.semantics.error.red50}`,
      }
    case "Green":
      return {
        background: color.semantics.success.green500,
        boxShadow: theme.elevation.small,
        border: `1px solid ${color.semantics.success.green50}`,
      }
  }
}

function labelFont(size: Props["size"]) {
  switch (size) {
    case "L":
      return font.medium17
    case "M":
      return font.medium14
    case "S":
      return font.medium12
  }
}

function labelColor(theme_: Props["theme_"], disabled: boolean) {
  if (disabled) return { color: color.neutral200 }

  switch (theme_) {
    case "Blue":
      return { color: color.neutral0 }
    case "Red":
      return { color: color.neutral0 }
    case "Green":
      return { color: color.neutral0 }
  }
}

const styles = {
  container: (
    size: Props["size"],
    theme_: Props["theme_"],
    disabled: boolean,
  ) =>
    css({
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: disabled ? "unset" : "pointer",
      backdropFilter: "blur(10px)",
      transform: "translateY(0)",
      transition:
        "transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease, filter 180ms ease",
      ...containerStyle(size),
      ...containerColor(theme_, disabled),
      "&:hover": disabled
        ? undefined
        : {
            transform: "translateY(-1px)",
            filter: "brightness(1.02)",
            boxShadow: theme.elevation.medium,
          },
      "&:active": disabled
        ? undefined
        : {
            transform: "translateY(0)",
            boxShadow: theme.elevation.small,
          },
    }),
  label: (size: Props["size"], theme_: Props["theme_"], disabled: boolean) =>
    css({
      ...labelFont(size),
      ...labelColor(theme_, disabled),
      lineHeight: 1.1,
      whiteSpace: "nowrap",
    }),
}

export default View
