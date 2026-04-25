import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as OrderPaymentAction from "../Action/OrderPayment"
import * as ReportAction from "../Action/Report"
import * as ProductRatingReportAction from "../Action/ProductRatingReport"
import { navigateTo, toRoute } from "../Route"
import { OrderPaymentStatus } from "../../../Core/App/OrderPayment/OrderPaymentStatus"
import { formatAddress } from "../../../Core/App/Address"
import { ReportStatus } from "../../../Core/App/Report"
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

      {state.productRatingReport.flashMessage != null ? (
        <div className={styles.notice}>
          {state.productRatingReport.flashMessage}
          <button
            className={styles.dismissBtn}
            onClick={() => emit(ProductRatingReportAction.clearFlashMessage())}
          >
            ✕
          </button>
        </div>
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
                    `${item.productName.unwrap()} (${item.variantName.unwrap()}) x${item.quantity.unwrap()}`,
                )
              : parseGoodsSummary(order.goodsSummary.unwrap())
          const currentStatus =
            state.orderPayment.statusDraftByOrderID[orderID] ?? order.status
          const report = state.report.sellerReports.find(
            (x) => x.orderID.unwrap() === orderID,
          )
          const displayStatus = formatStatusOption(
            currentStatus,
            report?.status,
          )
          const canAgreeCashbackByOrder =
            report != null &&
            (report.status === "OPEN" ||
              report.status === "SELLER_REPLIED" ||
              report.status === "UNDER_REVIEW")
          const lockedByBuyer =
            order.status === "RECEIVED" ||
            order.status === "DELIVERY_ISSUE" ||
            order.status === "REPORTED"

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
                  {displayStatus}
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
                    {formatDateTime(order.createdAt.unwrap())}
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
                <div className={styles.row}>{formatAddress(order.address)}</div>
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
                  {report != null &&
                  (order.status === "REPORTED" ||
                    order.status === "DELIVERY_ISSUE")
                    ? `Report status: ${humanizeReportStatus(report.status)}`
                    : order.status === "REPORTED"
                      ? "This order is under report review."
                      : "Buyer has completed this delivery flow."}
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

              {order.status === "REPORTED" ? (
                <div className={styles.actionRow}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() =>
                      emit(navigateTo(toRoute("SellerReports", {})))
                    }
                  >
                    Send Evidence
                  </button>
                  <button
                    className={styles.primaryButton}
                    disabled={canAgreeCashbackByOrder === false}
                    onClick={() => {
                      if (report != null) {
                        emit(
                          ReportAction.approveSellerRefund(report.id.unwrap()),
                        )
                      }
                    }}
                  >
                    Agree Cashback
                  </button>
                </div>
              ) : null}

              {(order.status === "DELIVERED" || order.status === "RECEIVED") &&
              order.items.length > 0 ? (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Report Spam Rating</div>
                  <div className={styles.ratingReportRow}>
                    {order.items.map((item) => {
                      const key = `${orderID}:${item.productID.unwrap()}`
                      const isReporting =
                        state.productRatingReport.reportingKey === key
                      return (
                        <button
                          key={key}
                          className={styles.secondaryButton}
                          disabled={isReporting}
                          onClick={() =>
                            emit(
                              ProductRatingReportAction.reportSpamRating(
                                orderID,
                                item.productID.unwrap(),
                              ),
                            )
                          }
                        >
                          {isReporting
                            ? "Reporting..."
                            : `Report "${item.productName.unwrap()}"`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
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
    case "REPORTED":
      return "neutral"
    case "DELIVERY_ISSUE":
      return "neutral"
    case "CANCELLED":
      return "neutral"
  }
}

function formatStatusOption(
  status: OrderPaymentStatus,
  reportStatus?: ReportStatus,
): string {
  if (
    (status === "REPORTED" || status === "DELIVERY_ISSUE") &&
    reportStatus != null
  ) {
    return `Report: ${humanizeReportStatus(reportStatus)}`
  }

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
    case "REPORTED":
      return "Under report review"
    case "DELIVERY_ISSUE":
      return "Delivery issue reported"
    case "CANCELLED":
      return "Cancelled"
  }
}

function humanizeReportStatus(status: ReportStatus): string {
  switch (status) {
    case "OPEN":
      return "Open"
    case "SELLER_REPLIED":
      return "Seller Replied"
    case "UNDER_REVIEW":
      return "Under Review"
    case "REFUND_APPROVED":
      return "Refund Approved"
    case "CASHBACK_COMPLETED":
      return "Cashback Completed"
    case "RESOLVED":
      return "Resolved"
    case "REJECTED":
      return "Rejected"
  }
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
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
    border: `1px solid ${color.genz.purple100}`,
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
    color: color.genz.pink,
    background: color.genz.pinkDim,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
  }),
  statusPill: css({
    ...font.medium14,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    border: `1px solid ${color.genz.purple200}`,
    color: color.genz.purple,
    background: color.genz.purpleDim,
    '&[data-tone="blue"]': {
      color: color.genz.pink,
      borderColor: color.genz.pink200,
      background: color.genz.pinkDim,
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
    border: `1px solid ${color.genz.purple100}`,
    background: color.neutral100,
  }),
  metaLabel: css({ ...font.medium14, color: color.genz.purple }),
  metaValue: css({
    ...font.regular14,
    color: color.neutral800,
    wordBreak: "break-word",
  }),
  section: css({ display: "grid", gap: theme.s1 }),
  sectionTitle: css({ ...font.bold14, color: color.neutral800 }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  rowMuted: css({ ...font.regular14, color: color.genz.purple }),
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
  actionRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  rowField: css({ display: "grid", gap: theme.s1 }),
  label: css({ ...font.medium14, color: color.genz.purple }),
  select: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
  }),
  input: css({
    border: `1px solid ${color.genz.purple300}`,
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
    color: color.genz.purple,
    marginBottom: theme.s2,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.s2,
  }),
  dismissBtn: css({
    border: "none",
    background: "transparent",
    cursor: "pointer",
    ...font.medium14,
    color: color.genz.purple,
    padding: 0,
  }),
  ratingReportRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  noticeBox: css({
    ...font.regular14,
    color: color.genz.purple,
    border: `1px dashed ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    background: color.neutral100,
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
  primaryButton: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
