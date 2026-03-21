import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { pollZaloStatus } from "../Action/Payment"
import { navigateTo, toRoute } from "../Route"

type Props = { state: State }

export default function PaymentResultPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return (
      <div className={styles.page}>
        <div className={styles.notice}>
          Please login to view payment status.
        </div>
      </div>
    )
  }

  const checkout = state.payment.zaloCheckout
  const statusRD = state.payment.zaloStatusResponse

  const statusLabel =
    statusRD._t === "Success"
      ? statusRD.data.status
      : statusRD._t === "Failure"
        ? "FAILED"
        : statusRD._t === "Loading"
          ? "PENDING"
          : "PENDING"

  const qrImageURL =
    checkout == null
      ? null
      : `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(checkout.orderURL)}`

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>ZaloPay Checkout</h1>
        <p className={styles.subtitle}>
          Complete your payment and wait for automatic verification.
        </p>

        <div className={styles.statusPill}>Status: {statusLabel}</div>

        {checkout != null ? (
          <>
            <div className={styles.metaRow}>
              AppTransID: {checkout.appTransID}
            </div>
            <div className={styles.qrWrap}>
              {qrImageURL != null ? (
                <img
                  src={qrImageURL}
                  alt="ZaloPay QR"
                  className={styles.qrImage}
                />
              ) : null}
            </div>
            <div className={styles.actionRow}>
              <button
                className={styles.primaryBtn}
                onClick={() => window.open(checkout.orderURL, "_blank")}
              >
                Open ZaloPay
              </button>
              <button
                className={styles.secondaryBtn}
                onClick={() => emit(pollZaloStatus())}
              >
                Check Status
              </button>
            </div>
          </>
        ) : (
          <div className={styles.notice}>No active checkout session.</div>
        )}

        <div className={styles.actionRow}>
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
    background: color.neutral50,
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  card: css({
    maxWidth: "560px",
    margin: "0 auto",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s3,
    padding: theme.s5,
    display: "grid",
    gap: theme.s3,
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
    color: color.secondary500,
  }),
  subtitle: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral700,
  }),
  statusPill: css({
    ...font.bold14,
    color: color.primary500,
    padding: `${theme.s1} ${theme.s2}`,
    background: color.secondary50,
    borderRadius: theme.s1,
    width: "fit-content",
  }),
  metaRow: css({
    ...font.regular13,
    color: color.neutral700,
    wordBreak: "break-all",
  }),
  qrWrap: css({
    display: "flex",
    justifyContent: "center",
  }),
  qrImage: css({
    width: "280px",
    height: "280px",
    borderRadius: theme.s2,
    border: `1px solid ${color.secondary200}`,
    background: color.neutral0,
  }),
  actionRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  primaryBtn: css({
    border: "none",
    background: color.primary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  secondaryBtn: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
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
