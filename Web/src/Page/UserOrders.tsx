import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as OrderPaymentAction from "../Action/OrderPayment"
import * as ProductRatingAction from "../Action/ProductRating"
import { canReportDeliveredOrder } from "../Data/ReportConfig"
import { ReportStatus } from "../../../Core/App/Report"

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

      {state.productRating.flashMessage != null ? (
        <div className={styles.notice}>
          {state.productRating.flashMessage}
          <button
            className={styles.dismissBtn}
            onClick={() => emit(ProductRatingAction.clearFlashMessage())}
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className={styles.headerRow}>
        <h1 className={styles.title}>My Orders</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("UserReports", {})))}
          >
            My Reports
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("Home", {})))}
          >
            Back Home
          </button>
        </div>
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
                    `${item.productName.unwrap()} (${item.variantName.unwrap()}) x${item.quantity.unwrap()}`,
                )
              : parseGoodsSummary(order.goodsSummary.unwrap())
          const canConfirmDelivery =
            order.isPaid && order.status === "DELIVERED"
          const alreadyReported = state.report.userReports.some(
            (report) => report.orderID.unwrap() === orderID,
          )
          const relatedReport = state.report.userReports.find(
            (report) => report.orderID.unwrap() === orderID,
          )
          const isReportableStatus =
            order.status === "DELIVERED" ||
            order.status === "RECEIVED" ||
            order.status === "DELIVERY_ISSUE"
          const canOpenReport =
            isReportableStatus &&
            canReportDeliveredOrder(order.updatedAt.unwrap())
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
                Date: {formatOrderDate(order.createdAt.unwrap())}
              </div>
              <div className={styles.row}>
                Payment Method: {order.paymentMethod}
              </div>
              <div className={styles.row}>
                Payment Status: {order.isPaid ? "Paid" : "Unpaid"}
              </div>
              <div className={styles.row}>
                Status:{" "}
                {formatOrderStatus(
                  order.status,
                  order.isPaid,
                  relatedReport?.status,
                )}
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

              {canOpenReport ? (
                <div className={styles.actionRow}>
                  <button
                    className={styles.secondaryActionButton}
                    disabled={alreadyReported}
                    onClick={() =>
                      emit(
                        navigateTo(
                          toRoute("UserReportCreate", {
                            orderID,
                            sellerID: order.sellerID.unwrap(),
                          }),
                        ),
                      )
                    }
                  >
                    {alreadyReported ? "Already Reported" : "Report Product"}
                  </button>
                </div>
              ) : null}

              {order.status === "RECEIVED" && order.items.length > 0 ? (
                <div className={styles.rateSection}>
                  <div className={styles.rateSectionTitle}>Rate Products</div>
                  {order.items.map((item) => {
                    const key = `${orderID}:${item.productID.unwrap()}`
                    const isRating = state.productRating.ratingKey === key
                    const scoreDraft =
                      state.productRating.scoreDraftByKey[key] ?? ""
                    const feedbackDraft =
                      state.productRating.feedbackDraftByKey[key] ?? ""

                    return (
                      <div
                        key={key}
                        className={styles.rateItem}
                      >
                        <div className={styles.rateItemName}>
                          {item.productName.unwrap()}
                        </div>
                        <div className={styles.rateForm}>
                          <select
                            className={styles.select}
                            value={scoreDraft}
                            onChange={(e) =>
                              emit(
                                ProductRatingAction.onChangeScore(
                                  key,
                                  e.currentTarget.value,
                                ),
                              )
                            }
                          >
                            <option value="">Score</option>
                            <option value="1">1 ★</option>
                            <option value="2">2 ★★</option>
                            <option value="3">3 ★★★</option>
                            <option value="4">4 ★★★★</option>
                            <option value="5">5 ★★★★★</option>
                          </select>
                          <input
                            className={styles.input}
                            type="text"
                            placeholder="Feedback (optional)"
                            value={feedbackDraft}
                            onChange={(e) =>
                              emit(
                                ProductRatingAction.onChangeFeedback(
                                  key,
                                  e.currentTarget.value,
                                ),
                              )
                            }
                          />
                          <button
                            className={styles.primaryButton}
                            disabled={isRating || scoreDraft === ""}
                            onClick={() =>
                              emit(
                                ProductRatingAction.submitRating(
                                  orderID,
                                  item.productID.unwrap(),
                                ),
                              )
                            }
                          >
                            {isRating ? "Submitting..." : "Rate"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
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

function formatOrderStatus(
  status: string,
  isPaid: boolean,
  reportStatus?: ReportStatus,
): string {
  if (isPaid === false) {
    return "Awaiting payment"
  }

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
      return "Seller is packing"
    case "IN_TRANSIT":
      return "Seller is shipping"
    case "DELIVERED":
      return "Delivered - awaiting your confirmation"
    case "RECEIVED":
      return "Received"
    case "REPORTED":
      return "Reported - under review"
    case "DELIVERY_ISSUE":
      return "Delivery issue reported"
    case "CANCELLED":
      return "Cancelled"
    default:
      return status
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
  headerActions: css({
    display: "flex",
    gap: theme.s2,
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
    color: color.secondary500,
    padding: 0,
  }),
  select: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  input: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    flex: 1,
    minWidth: "120px",
  }),
  rateSection: css({
    display: "grid",
    gap: theme.s2,
    marginTop: theme.s2,
    padding: `${theme.s3}`,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    background: color.neutral50,
  }),
  rateSectionTitle: css({ ...font.bold14, color: color.neutral800 }),
  rateItem: css({ display: "grid", gap: theme.s1 }),
  rateItemName: css({ ...font.medium14, color: color.neutral700 }),
  rateForm: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    alignItems: "center",
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
