import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as OrderPaymentAction from "../Action/OrderPayment"

type Props = { state: State }

export default function UserOrdersPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return <div className={styles.info}>Please login as user first.</div>
  }

  const orders = state.orderPayment.userOrders

  return (
    <div className={styles.page}>
      {state.orderPayment.flashMessage != null ? (
        <div className={styles.notice}>{state.orderPayment.flashMessage}</div>
      ) : null}

      <div className={styles.headerRow}>
        <h1 className={styles.title}>My Orders</h1>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(navigateTo(toRoute("Home", {})))}
        >
          Back Home
        </button>
      </div>

      {state.orderPayment.userOrdersResponse._t === "Loading" ? (
        <div className={styles.info}>Loading your orders...</div>
      ) : null}

      {orders.length === 0 &&
      state.orderPayment.userOrdersResponse._t === "Success" ? (
        <div className={styles.info}>No orders yet.</div>
      ) : null}

      <div className={styles.list}>
        {orders.map((order) => {
          const orderID = order.id.unwrap()
          const goodsItems =
            order.items.length > 0
              ? order.items.map(
                  (item) =>
                    `${item.productName} (${item.variantName}) x${item.quantity}`,
                )
              : parseGoodsSummary(order.goodsSummary)
          const canConfirmDelivery =
            order.isPaid && order.status === "DELIVERED"
          const confirmingDelivery =
            state.orderPayment.confirmDeliveryResponse._t === "Loading"

          return (
            <article
              key={orderID}
              className={styles.card}
            >
              <div className={styles.row}>Order ID: {orderID}</div>
              <div className={styles.row}>
                Shop ID: {order.sellerID.unwrap()}
              </div>
              <div className={styles.row}>
                Date: {formatOrderDate(order.createdAt)}
              </div>
              <div className={styles.row}>
                Payment Method: {order.paymentMethod}
              </div>
              <div className={styles.row}>
                Payment Status: {order.isPaid ? "Paid" : "Unpaid"}
              </div>
              <div className={styles.row}>
                Status: {formatOrderStatus(order.status, order.isPaid)}
              </div>
              <div className={styles.row}>
                Address: {order.address.unwrap()}
              </div>
              <div className={styles.row}>
                Price: {formatT(order.price.unwrap())}
              </div>
              <div className={styles.rowField}>
                <div className={styles.rowLabel}>Items Bought</div>
                {goodsItems.length === 0 ? (
                  <div className={styles.row}>No item details available.</div>
                ) : (
                  <ul className={styles.goodsList}>
                    {goodsItems.map((item, idx) => (
                      <li
                        key={`${orderID}-${idx}`}
                        className={styles.goodsItem}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={styles.row}>
                Tracking: {order.trackingCode?.unwrap() ?? "Not assigned"}
              </div>

              {canConfirmDelivery ? (
                <div className={styles.actionRow}>
                  <button
                    className={styles.primaryButton}
                    disabled={confirmingDelivery}
                    onClick={() =>
                      emit(
                        OrderPaymentAction.submitDeliveryDecision(
                          orderID,
                          "RECEIVED",
                        ),
                      )
                    }
                  >
                    Confirm Received
                  </button>
                  <button
                    className={styles.secondaryActionButton}
                    disabled={confirmingDelivery}
                    onClick={() =>
                      emit(
                        OrderPaymentAction.submitDeliveryDecision(
                          orderID,
                          "DELIVERY_ISSUE",
                        ),
                      )
                    }
                  >
                    I Didn&apos;t Receive
                  </button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function formatT(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function formatOrderDate(value: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatOrderStatus(status: string, isPaid: boolean): string {
  if (isPaid === false) {
    return "Awaiting payment"
  }

  switch (status) {
    case "PAID":
      return "Seller is preparing"
    case "PACKED":
      return "Seller is packing"
    case "IN_TRANSIT":
      return "Seller is shipping"
    case "DELIVERED":
      return "Delivered - awaiting your confirmation"
    case "RECEIVED":
      return "Received"
    case "DELIVERY_ISSUE":
      return "Delivery issue reported"
    case "CANCELLED":
      return "Cancelled"
    default:
      return status
  }
}

function parseGoodsSummary(summary: string): string[] {
  if (summary.trim() === "") {
    return []
  }

  return summary
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "")
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
    gap: theme.s1,
    background: color.neutral0,
  }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  rowField: css({ display: "grid", gap: theme.s1 }),
  rowLabel: css({ ...font.bold14, color: color.neutral800 }),
  goodsList: css({
    margin: 0,
    paddingLeft: theme.s4,
    display: "grid",
    gap: theme.s1,
  }),
  goodsItem: css({ ...font.regular14, color: color.neutral700 }),
  actionRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    marginTop: theme.s1,
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  }),
  secondaryActionButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
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
}
