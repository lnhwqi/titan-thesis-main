import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import * as PaymentAction from "../Action/Payment"
import { navigateTo, toRoute } from "../Route"

type Props = { state: State }

export default function WalletDepositPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return <div className={styles.info}>Please login as user first.</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Wallet Deposit</h1>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(navigateTo(toRoute("Payment", {})))}
        >
          Back Payment
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          Current Wallet: {formatT(state.profile.wallet.unwrap())}
        </div>

        {state.payment.depositCheckout != null ? (
          <div className={styles.row}>
            Deposit Session: {state.payment.depositCheckout.appTransID}
          </div>
        ) : null}

        {state.payment.depositStatusResponse._t === "Success" ? (
          <div className={styles.row}>
            Status: {state.payment.depositStatusResponse.data.status}
          </div>
        ) : null}

        <div className={styles.field}>
          <span className={styles.label}>Deposit Amount</span>
          <InputText
            value={state.payment.depositAmount}
            type="number"
            invalid={false}
            placeholder="Enter amount"
            onChange={(value) =>
              emit(PaymentAction.onChangeDepositAmount(value))
            }
          />
        </div>

        <Button
          theme_={"Red"}
          size={"M"}
          label={
            state.payment.depositCreateResponse._t === "Loading"
              ? "Creating Session..."
              : "Deposit"
          }
          onClick={() => emit(PaymentAction.submitDeposit())}
          disabled={state.payment.depositCreateResponse._t === "Loading"}
        />

        {state.payment.depositCheckout != null ? (
          <Button
            theme_={"Blue"}
            size={"M"}
            label={
              state.payment.depositStatusResponse._t === "Loading"
                ? "Checking..."
                : "Check Deposit Status"
            }
            onClick={() => emit(PaymentAction.pollDepositStatus())}
            disabled={state.payment.depositStatusResponse._t === "Loading"}
          />
        ) : null}
      </div>
    </div>
  )
}

function formatT(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
  }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  headerRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s4,
    gap: theme.s3,
    flexWrap: "wrap",
  }),
  card: css({
    display: "grid",
    gap: theme.s3,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    padding: theme.s4,
    maxWidth: "520px",
  }),
  field: css({ display: "grid", gap: theme.s1 }),
  label: css({ ...font.medium14, color: color.genz.purple }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  info: css({
    ...font.regular14,
    color: color.neutral700,
    textAlign: "center",
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
