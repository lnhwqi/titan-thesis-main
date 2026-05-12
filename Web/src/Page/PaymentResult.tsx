import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"

type Props = { state: State }

export default function PaymentResultPage(props: Props): JSX.Element {
  const { state } = props

  if (!("updateProfile" in state)) {
    return (
      <div className={styles.page}>
        <div className={styles.notice}>
          Please login to view payment status.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Wallet Payment</h1>
        <p className={styles.subtitle}>
          Wallet top-up is now handled on the wallet deposit page.
        </p>

        {state.payment.flashMessage != null ? (
          <div className={styles.alert}>{state.payment.flashMessage}</div>
        ) : null}

        <div className={styles.statusPill}>
          Use Wallet Deposit before checkout.
        </div>

        <div className={styles.actionRow}>
          <button
            className={styles.secondaryBtn}
            onClick={() => emit(navigateTo(toRoute("WalletDeposit", {})))}
          >
            Open Wallet Deposit
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={() => emit(navigateTo(toRoute("Home", {})))}
          >
            Back Home
          </button>
        </div>
      </section>
    </div>
  )
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  card: css({
    maxWidth: "560px",
    margin: "0 auto",
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s5,
    display: "grid",
    gap: theme.s3,
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
    color: color.genz.purple,
  }),
  subtitle: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral700,
  }),
  alert: css({
    ...font.medium14,
    color: color.semantics.error.red500,
    background: color.semantics.error.red20,
    border: `1px solid ${color.semantics.error.red50}`,
    borderRadius: theme.s1,
    padding: `${theme.s2} ${theme.s3}`,
  }),
  statusPill: css({
    ...font.bold14,
    color: color.genz.pink,
    padding: `${theme.s1} ${theme.s2}`,
    background: color.genz.purpleDim,
    borderRadius: theme.s1,
    width: "fit-content",
  }),
  actionRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  secondaryBtn: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  notice: css({
    ...font.regular14,
    color: color.neutral700,
    textAlign: "center",
  }),
}
