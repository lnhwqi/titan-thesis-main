import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as OrderPaymentAction from "../Action/OrderPayment"
import { navigateTo, toRoute } from "../Route"
import { OrderPaymentStatus } from "../../../Core/App/OrderPayment/OrderPaymentStatus"

type Props = { state: State }

const STATUS_OPTIONS: OrderPaymentStatus[] = [
  "PAID",
  "PACKED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
]

export default function SellerOrdersPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthSeller") {
    return <div className={styles.info}>Please login as seller first.</div>
  }

  const orders = state.orderPayment.sellerOrders

  return (
    <div className={styles.page}>
      {state.orderPayment.flashMessage != null ? (
        <div className={styles.notice}>{state.orderPayment.flashMessage}</div>
      ) : null}

      <div className={styles.headerRow}>
        <h1 className={styles.title}>Shop Orders</h1>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
        >
          Back Dashboard
        </button>
      </div>

      {state.orderPayment.sellerOrdersResponse._t === "Loading" ? (
        <div className={styles.info}>Loading shop orders...</div>
      ) : null}

      {orders.length === 0 &&
      state.orderPayment.sellerOrdersResponse._t === "Success" ? (
        <div className={styles.info}>No orders for your shop yet.</div>
      ) : null}

      <div className={styles.list}>
        {orders.map((order) => {
          const orderID = order.id.unwrap()
          return (
            <article
              key={orderID}
              className={styles.card}
            >
              <div className={styles.row}>Order ID: {orderID}</div>
              <div className={styles.row}>
                Receiver: {order.username.unwrap()}
              </div>
              <div className={styles.row}>
                Address: {order.address.unwrap()}
              </div>
              <div className={styles.row}>
                Price: {formatT(order.price.unwrap())}
              </div>

              <div className={styles.rowField}>
                <label className={styles.label}>Status</label>
                <select
                  className={styles.select}
                  value={
                    state.orderPayment.statusDraftByOrderID[orderID] ??
                    order.status
                  }
                  onChange={(e) => {
                    const nextStatus = parseStatus(e.currentTarget.value)
                    if (nextStatus != null) {
                      emit(
                        OrderPaymentAction.onChangeStatusDraft(
                          orderID,
                          nextStatus,
                        ),
                      )
                    }
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.rowField}>
                <label className={styles.label}>Tracking code</label>
                <input
                  className={styles.input}
                  type="text"
                  value={
                    state.orderPayment.trackingDraftByOrderID[orderID] ?? ""
                  }
                  placeholder="Enter tracking code"
                  onChange={(e) =>
                    emit(
                      OrderPaymentAction.onChangeTrackingDraft(
                        orderID,
                        e.currentTarget.value,
                      ),
                    )
                  }
                />
              </div>

              <button
                className={styles.primaryButton}
                onClick={() =>
                  emit(OrderPaymentAction.submitTrackingUpdate(orderID))
                }
              >
                Update Tracking
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function parseStatus(value: string): OrderPaymentStatus | null {
  switch (value) {
    case "PAID":
    case "PACKED":
    case "IN_TRANSIT":
    case "DELIVERED":
    case "CANCELLED":
      return value
    default:
      return null
  }
}

function formatT(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

const styles = {
  page: css({ padding: theme.s6 }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  headerRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s4,
  }),
  list: css({ display: "grid", gap: theme.s3 }),
  card: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    padding: theme.s3,
    display: "grid",
    gap: theme.s2,
    background: color.neutral0,
  }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  rowField: css({ display: "grid", gap: theme.s1 }),
  label: css({ ...font.medium14, color: color.secondary500 }),
  select: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
  }),
  input: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  info: css({
    ...font.regular14,
    color: color.neutral700,
    textAlign: "center",
  }),
  notice: css({
    ...font.regular14,
    color: color.secondary500,
    marginBottom: theme.s2,
    textAlign: "center",
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
