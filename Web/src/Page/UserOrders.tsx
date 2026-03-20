import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"

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
        {orders.map((order) => (
          <article
            key={order.id.unwrap()}
            className={styles.card}
          >
            <div className={styles.row}>Order ID: {order.id.unwrap()}</div>
            <div className={styles.row}>Shop ID: {order.sellerID.unwrap()}</div>
            <div className={styles.row}>Status: {order.status}</div>
            <div className={styles.row}>Address: {order.address.unwrap()}</div>
            <div className={styles.row}>
              Price: {formatT(order.price.unwrap())}
            </div>
            <div className={styles.row}>
              Tracking: {order.trackingCode?.unwrap() ?? "Not assigned"}
            </div>
          </article>
        ))}
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
