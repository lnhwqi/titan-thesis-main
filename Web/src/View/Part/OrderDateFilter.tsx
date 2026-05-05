import { JSX } from "react"
import { css } from "@emotion/css"
import { font, theme } from "../Theme"

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

export default function OrderDateFilter(props: Props): JSX.Element {
  return (
    <div className={styles.container}>
      <label className={styles.label}>{props.label}</label>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="date"
          value={props.value}
          onChange={(e) => props.onChange(e.currentTarget.value)}
        />
        {props.value !== "" && props.onClear != null ? (
          <button
            className={styles.clearButton}
            onClick={props.onClear}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}

const styles = {
  container: css({
    display: "grid",
    gap: theme.s1,
  }),
  label: css({
    ...font.medium12,
    color: "#64748B",
  }),
  row: css({
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
  }),
  input: css({
    border: "1px solid #CBD5E1",
    borderRadius: theme.s1,
    padding: `${theme.s2} ${theme.s3}`,
    background: "#FFFFFF",
    color: "#334155",
    ...font.regular14,
    minHeight: 36,
    width: "100%",
  }),
  clearButton: css({
    border: "1px solid #CBD5E1",
    borderRadius: theme.s1,
    background: "#FFFFFF",
    color: "#64748B",
    ...font.medium12,
    padding: `${theme.s1} ${theme.s2}`,
    cursor: "pointer",
    minHeight: 36,
    whiteSpace: "nowrap",
    "&:hover": {
      borderColor: "#94A3B8",
      background: "#F8FAFC",
    },
  }),
}
