import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as OrderPaymentAction from "../Action/OrderPayment"
import { navigateTo, toRoute } from "../Route"
import { OrderPaymentStatus } from "../../../Core/App/OrderPayment/OrderPaymentStatus"
import * as AuthToken from "../App/AuthToken"

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
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
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
          const goodsItems =
            order.items.length > 0
              ? order.items.map(
                  (item) =>
                    `${item.productName} (${item.variantName}) x${item.quantity}`,
                )
              : parseGoodsSummary(order.goodsSummary)
          const currentStatus =
            state.orderPayment.statusDraftByOrderID[orderID] ?? order.status
          const lockedByBuyer =
            order.status === "RECEIVED" || order.status === "DELIVERY_ISSUE"

          return (
            <article
              key={orderID}
              className={styles.card}
            >
              <div className={styles.topRow}>
                <div className={styles.orderCode}>#{orderID.slice(0, 8)}</div>
                <div
                  className={styles.statusPill}
                  data-tone={statusTone(currentStatus)}
                >
                  {formatStatusOption(currentStatus)}
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order ID</span>
                  <span className={styles.metaValue}>{orderID}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Created</span>
                  <span className={styles.metaValue}>
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Receiver</span>
                  <span className={styles.metaValue}>
                    {order.username.unwrap()}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Amount</span>
                  <span className={styles.metaValue}>
                    {formatT(order.price.unwrap())}
                  </span>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Ship to</div>
                <div className={styles.row}>{order.address.unwrap()}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  Pick list ({goodsItems.length})
                </div>
                {goodsItems.length === 0 ? (
                  <div className={styles.rowGoods}>No goods info</div>
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

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Tracking code</div>
                <div className={styles.rowMuted}>
                  Current: {order.trackingCode?.unwrap() ?? "Not set"}
                </div>
              </div>

              {lockedByBuyer ? (
                <div className={styles.noticeBox}>
                  Buyer has completed this delivery flow.
                </div>
              ) : (
                <>
                  <div className={styles.rowField}>
                    <label className={styles.label}>Status</label>
                    <select
                      className={styles.select}
                      value={currentStatus}
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
                          {formatStatusOption(status)}
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
                </>
              )}
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

function formatDateTime(value: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
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

function statusTone(status: OrderPaymentStatus): "neutral" | "blue" | "green" {
  switch (status) {
    case "PAID":
    case "PACKED":
      return "blue"
    case "IN_TRANSIT":
      return "neutral"
    case "DELIVERED":
      return "green"
    case "RECEIVED":
      return "green"
    case "DELIVERY_ISSUE":
      return "neutral"
    case "CANCELLED":
      return "neutral"
  }
}

function formatStatusOption(status: OrderPaymentStatus): string {
  switch (status) {
    case "PAID":
      return "Seller is preparing"
    case "PACKED":
      return "Packing"
    case "IN_TRANSIT":
      return "Shipping"
    case "DELIVERED":
      return "Delivered"
    case "RECEIVED":
      return "Received by buyer"
    case "DELIVERY_ISSUE":
      return "Delivery issue reported"
    case "CANCELLED":
      return "Cancelled"
  }
}

const styles = {
  page: css({
    padding: theme.s6,
    "@media (max-width: 768px)": {
      padding: theme.s4,
    },
  }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  headerRow: css({
    display: "flex",
    gap: theme.s3,
    flexWrap: "wrap",
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
    gap: theme.s3,
    background: color.neutral0,
  }),
  topRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  orderCode: css({
    ...font.bold14,
    color: color.primary500,
    background: color.primary50,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
  }),
  statusPill: css({
    ...font.medium14,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    border: `1px solid ${color.secondary200}`,
    color: color.secondary500,
    background: color.secondary50,
    '&[data-tone="blue"]': {
      color: color.primary500,
      borderColor: color.primary200,
      background: color.primary50,
    },
    '&[data-tone="green"]': {
      color: color.semantics.success.green500,
      borderColor: color.semantics.success.green500,
      background: color.semantics.success.green50,
    },
  }),
  metaGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: theme.s2,
  }),
  metaItem: css({
    display: "grid",
    gap: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    borderRadius: theme.s1,
    border: `1px solid ${color.secondary100}`,
    background: color.neutral100,
  }),
  metaLabel: css({ ...font.medium14, color: color.secondary500 }),
  metaValue: css({
    ...font.regular14,
    color: color.neutral800,
    wordBreak: "break-word",
  }),
  section: css({ display: "grid", gap: theme.s1 }),
  sectionTitle: css({ ...font.bold14, color: color.neutral800 }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  rowMuted: css({ ...font.regular14, color: color.secondary500 }),
  rowGoods: css({
    ...font.regular14,
    color: color.neutral700,
    whiteSpace: "pre-wrap",
  }),
  goodsList: css({
    margin: 0,
    paddingLeft: theme.s4,
    display: "grid",
    gap: theme.s1,
  }),
  goodsItem: css({
    ...font.regular14,
    color: color.neutral700,
    lineHeight: 1.45,
  }),
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
  noticeBox: css({
    ...font.regular14,
    color: color.secondary500,
    border: `1px dashed ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    background: color.neutral100,
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
