import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import * as PaymentAction from "../Action/Payment"
import { navigateTo, toRoute } from "../Route"
import {
  AuthPageShell,
  AuthPageHeader,
  AuthPageCard,
  AuthGateCard,
} from "../View/Part/AuthPageShell"

type Props = { state: State }

export default function WalletDepositPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return (
      <AuthPageShell>
        <AuthGateCard
          title="Wallet Deposit"
          message="Please login to access wallet deposit."
          loginRedirect="/wallet/deposit"
        />
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <div className={styles.headerRow}>
        <AuthPageHeader
          title="Wallet Deposit"
          subtitle="Top up your wallet balance."
        />
        <Button
          theme_={"Blue"}
          size={"M"}
          label={"Back to Payment"}
          onClick={() => emit(navigateTo(toRoute("Payment", {})))}
        />
      </div>

      <AuthPageCard>
        {state.payment.flashMessage != null ? (
          <div className={styles.notice}>
            <span>{state.payment.flashMessage}</span>
            <button
              className={styles.noticeDismiss}
              onClick={() => emit(PaymentAction.clearFlashMessage())}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Current Balance</span>
            <span className={styles.infoValue}>
              {formatT(state.profile.wallet.unwrap())}
            </span>
          </div>

          {state.payment.depositCheckout != null ? (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Deposit Session</span>
              <span className={styles.infoValue}>
                {state.payment.depositCheckout.appTransID}
              </span>
            </div>
          ) : null}

          {state.payment.depositStatusResponse._t === "Success" ? (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>
                {state.payment.depositStatusResponse.data.status}
              </span>
            </div>
          ) : null}
        </div>

        <div className={styles.divider} />

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

        <div className={styles.actions}>
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
      </AuthPageCard>
    </AuthPageShell>
  )
}

function formatT(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

const styles = {
  headerRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    flexWrap: "wrap",
  }),
  infoGrid: css({
    display: "grid",
    gap: theme.s2,
  }),
  infoRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s3,
  }),
  infoLabel: css({
    ...font.regular14,
    color: color.neutral600,
  }),
  infoValue: css({
    ...font.medium14,
    color: color.neutral800,
  }),
  divider: css({
    height: "1px",
    background: color.secondary100,
    margin: `${theme.s4} 0`,
  }),
  field: css({
    display: "grid",
    gap: theme.s1,
    maxWidth: "480px",
  }),
  label: css({
    ...font.medium14,
    color: color.secondary500,
  }),
  actions: css({
    display: "flex",
    gap: theme.s3,
    flexWrap: "wrap",
    marginTop: theme.s2,
  }),
  notice: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s3,
    padding: `${theme.s3} ${theme.s4}`,
    background: color.secondary50,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.br5,
    ...font.regular14,
    color: color.secondary500,
    marginBottom: theme.s4,
  }),
  noticeDismiss: css({
    background: "none",
    border: "none",
    cursor: "pointer",
    ...font.medium14,
    color: color.secondary500,
    padding: 0,
    flexShrink: 0,
  }),
}
