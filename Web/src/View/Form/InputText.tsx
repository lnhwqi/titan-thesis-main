import { JSX } from "react"
import { css } from "@emotion/css"
import { color, font, theme } from "../Theme"

type Props = {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  onBlur?: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  changed?: boolean
  type?: "text" | "password" | "email" | "number" | "tel" | "url" | "date"
}
function View({
  value,
  placeholder,
  onChange,
  onBlur,
  disabled,
  invalid,
  changed,
  type,
}: Props): JSX.Element {
  const disabled_ = disabled || false
  const invalid_ = invalid || false
  const changed_ = changed || false
  return (
    <div className={styles.container(disabled_, invalid_, changed_)}>
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled_}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        onBlur={(e) => {
          if (onBlur) onBlur(e.target.value)
        }}
        className={styles.input(disabled_, invalid_)}
        type={type}
      />
    </div>
  )
}

const styles = {
  container: (disabled: boolean, invalid: boolean, changed: boolean) =>
    css({
      display: "flex",
      gap: theme.s2,
      justifyContent: "center",
      alignItems: "center",
      minHeight: theme.s11,
      borderRadius: theme.br3,
      padding: `${theme.s2} ${theme.s3}`,
      background: disabled
        ? "var(--app-surface-muted)"
        : "var(--app-surface-strong)",
      border: `1px solid ${invalid ? color.semantics.error.red500 : changed ? color.semantics.warning.yellow500 : "var(--app-border)"}`,
      boxShadow: invalid ? "none" : theme.elevation.xsmall,
      boxSizing: "border-box",
      backdropFilter: "blur(10px)",
      transition:
        "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
      "&:focus-within": {
        borderColor: invalid
          ? color.semantics.error.red500
          : "var(--app-brand-400)",
        boxShadow: invalid
          ? "0 0 0 4px var(--app-error-20)"
          : "0 0 0 4px var(--app-brand-20)",
      },
    }),
  input: (disabled: boolean, invalid: boolean) =>
    css({
      ...font.regular14,
      width: "100%",
      minHeight: theme.s6,
      border: "none",
      background: "none",
      outline: "none",
      color: invalid
        ? color.semantics.error.red500
        : disabled
          ? "var(--app-text-muted)"
          : "var(--app-text)",
      "::placeholder": {
        color: invalid ? color.semantics.error.red500 : "var(--app-text-muted)",
      },
    }),
}

export default View
