import { JSX } from "react"
import { css, keyframes } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as OrderPaymentAction from "../Action/OrderPayment"
import * as ProductRatingAction from "../Action/ProductRating"
import { canReportDeliveredOrder } from "../Data/ReportConfig"
import { formatAddress } from "../../../Core/App/Address"
import { ReportStatus } from "../../../Core/App/Report"

type Props = { state: State }

export default function UserOrdersPage(props: Props): JSX.Element {
  const { state } = props

  if (state._t !== "AuthUser") {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Authentication Required</h1>
          <p className={styles.gateText}>Please login to view your orders.</p>
        </div>
      </div>
    )
  }

  const orders = state.orderPayment.userOrders

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.subtitle}>
            Track, manage, and review your purchases.
          </p>
        </div>
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
      </header>

      {/* --- Flash Message Banners --- */}
      <div className={styles.flashContainer}>
        {state.orderPayment.flashMessage != null ? (
          <div className={styles.flashBannerInfo}>
            <span>{state.orderPayment.flashMessage}</span>
          </div>
        ) : null}

        {state.productRating.flashMessage != null ? (
          <div className={styles.flashBannerSuccess}>
            <span>{state.productRating.flashMessage}</span>
            <button
              className={styles.dismissBtn}
              onClick={() => emit(ProductRatingAction.clearFlashMessage())}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>

      {state.orderPayment.userOrdersResponse._t === "Loading" ? (
        <div className={styles.infoMeta}>Loading your orders...</div>
      ) : null}

      {orders.length === 0 &&
      state.orderPayment.userOrdersResponse._t === "Success" ? (
        <div className={styles.infoMeta}>You havent placed any orders yet.</div>
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
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <span className={styles.orderIdLabel}>Order ID:</span>
                  <span className={styles.orderIdValue}>{orderID}</span>
                </div>
                <div className={styles.statusPill}>
                  {formatOrderStatus(
                    order.status,
                    order.isPaid,
                    relatedReport?.status,
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Shop ID</div>
                    <div className={styles.detailValue}>
                      {order.sellerID.unwrap()}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Date</div>
                    <div className={styles.detailValue}>
                      {formatOrderDate(order.createdAt.unwrap())}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Payment Method</div>
                    <div className={styles.detailValue}>
                      {order.paymentMethod}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Total Price</div>
                    <div className={styles.detailValuePrice}>
                      {formatT(order.price.unwrap())}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Tracking Code</div>
                    <div className={styles.detailValue}>
                      {order.trackingCode?.unwrap() ?? "Not assigned"}
                    </div>
                  </div>
                  <div className={styles.detailItemFull}>
                    <div className={styles.detailLabel}>Shipping Address</div>
                    <div className={styles.detailValue}>
                      {formatAddress(order.address)}
                    </div>
                  </div>
                </div>

                <div className={styles.itemsSection}>
                  <div className={styles.detailLabel}>Items Bought</div>
                  {goodsItems.length === 0 ? (
                    <div className={styles.detailValue}>
                      No item details available.
                    </div>
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

                {/* Actions */}
                {(canConfirmDelivery || canOpenReport) && (
                  <div className={styles.actionRow}>
                    {canConfirmDelivery && (
                      <>
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
                          I Didnt Receive
                        </button>
                      </>
                    )}

                    {canOpenReport && (
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
                        {alreadyReported
                          ? "Already Reported"
                          : "Report Product"}
                      </button>
                    )}
                  </div>
                )}

                {/* Rating Section */}
                {order.status === "RECEIVED" && order.items.length > 0 ? (
                  <div className={styles.rateSection}>
                    <div className={styles.rateSectionTitle}>Rate Products</div>
                    <div className={styles.rateList}>
                      {order.items.map((item) => {
                        const key = `${orderID}:${item.productID.unwrap()}`
                        const userRating = state.productRating.userRatings[key]
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

                            {userRating ? (
                              <div className={styles.ratingDisplayed}>
                                <div className={styles.ratingScore}>
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <span
                                      key={i}
                                      style={{
                                        color:
                                          i <= userRating.score.unwrap()
                                            ? color.semantics.warning.yellow500
                                            : color.secondary300,
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className={styles.ratingValue}>
                                    {userRating.score.unwrap()}/5
                                  </span>
                                </div>
                                {userRating.feedback != null && (
                                  <div className={styles.ratingFeedbackText}>
                                    &quot;{userRating.feedback.unwrap()}&quot;
                                  </div>
                                )}
                              </div>
                            ) : (
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
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      {/* Pagination Controls */}
      <div className={styles.paginationContainer}>
        <button
          className={styles.paginationButton}
          disabled={state.orderPayment.userOrdersPage === 1}
          onClick={() =>
            emit(
              OrderPaymentAction.changeUserOrdersPage(
                state.orderPayment.userOrdersPage - 1,
              ),
            )
          }
        >
          ← Previous
        </button>
        <span className={styles.paginationInfo}>
          Page {state.orderPayment.userOrdersPage} of{" "}
          {Math.ceil(
            state.orderPayment.userOrdersTotalCount /
              state.orderPayment.userOrdersLimit,
          ) || 1}
        </span>
        <button
          className={styles.paginationButton}
          disabled={
            state.orderPayment.userOrdersPage >=
            Math.ceil(
              state.orderPayment.userOrdersTotalCount /
                state.orderPayment.userOrdersLimit,
            )
          }
          onClick={() =>
            emit(
              OrderPaymentAction.changeUserOrdersPage(
                state.orderPayment.userOrdersPage + 1,
              ),
            )
          }
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// Helpers
function formatT(value: number): string {
  return `₫${new Intl.NumberFormat("en-US", {
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
    return "Awaiting Payment"
  }

  if (
    (status === "REPORTED" || status === "DELIVERY_ISSUE") &&
    reportStatus != null
  ) {
    return `Report: ${humanizeReportStatus(reportStatus)}`
  }

  switch (status) {
    case "PAID":
      return "Preparing"
    case "PACKED":
      return "Packed"
    case "IN_TRANSIT":
      return "In Transit"
    case "DELIVERED":
      return "Delivered"
    case "RECEIVED":
      return "Received"
    case "REPORTED":
      return "Under Review"
    case "DELIVERY_ISSUE":
      return "Issue Reported"
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

// Animations
const slideDown = keyframes`
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`

// Styles
const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.secondary100} 0%, transparent 34%),` +
      `radial-gradient(circle at 85% 12%, ${color.secondary200} 0%, transparent 30%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
  }),
  headerRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.s6,
    gap: theme.s4,
    ...bp.sm({
      flexDirection: "column",
    }),
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
    color: color.neutral900,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    marginTop: theme.s2,
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  flashContainer: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    marginBottom: theme.s4,
  }),
  flashBannerSuccess: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${theme.s3} ${theme.s4}`,
    backgroundColor: color.semantics.success.green50,
    border: `1px solid ${color.semantics.success.green500}`,
    borderRadius: theme.s2,
    color: color.semantics.success.green500,
    ...font.medium14,
    boxShadow: theme.elevation.small,
    animation: `${slideDown} 0.3s ease-out`,
  }),
  flashBannerInfo: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${theme.s3} ${theme.s4}`,
    backgroundColor: color.secondary50,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.s2,
    color: color.secondary500,
    ...font.medium14,
    boxShadow: theme.elevation.small,
    animation: `${slideDown} 0.3s ease-out`,
  }),
  dismissBtn: css({
    border: "none",
    background: "transparent",
    cursor: "pointer",
    ...font.medium14,
    color: "inherit",
    padding: theme.s1,
    opacity: 0.7,
    transition: "opacity 0.2s",
    "&:hover": {
      opacity: 1,
    },
  }),
  infoMeta: css({
    ...font.regular14,
    color: color.neutral600,
    padding: theme.s6,
    textAlign: "center",
    background: color.neutral0,
    borderRadius: theme.s3,
    border: `1px dashed ${color.secondary200}`,
  }),
  list: css({
    display: "grid",
    gap: theme.s5,
  }),
  card: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.s4,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.2s",
    "&:hover": {
      boxShadow: theme.elevation.medium,
    },
  }),
  cardHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${theme.s3} ${theme.s5}`,
    backgroundColor: color.neutral50,
    borderBottom: `1px solid ${color.secondary100}`,
    flexWrap: "wrap",
    gap: theme.s2,
  }),
  headerLeft: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  orderIdLabel: css({
    ...font.medium14,
    color: color.neutral600,
  }),
  orderIdValue: css({
    ...font.bold14,
    color: color.neutral900,
  }),
  statusPill: css({
    display: "inline-block",
    padding: `${theme.s1} ${theme.s3}`,
    background: color.secondary100,
    color: color.secondary500,
    borderRadius: "16px",
    ...font.boldH5_20,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  }),
  cardBody: css({
    padding: theme.s5,
    display: "flex",
    flexDirection: "column",
    gap: theme.s5,
  }),
  detailsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.s4,
    ...bp.md({
      gridTemplateColumns: "repeat(3, 1fr)",
    }),
  }),
  detailItem: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  detailItemFull: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    gridColumn: "1 / -1",
  }),
  detailLabel: css({
    ...font.medium12,
    color: color.neutral600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  detailValue: css({
    ...font.regular14,
    color: color.neutral900,
  }),
  detailValuePrice: css({
    ...font.boldH5_20,
    color: color.secondary500,
  }),
  itemsSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    paddingTop: theme.s4,
    borderTop: `1px dashed ${color.secondary100}`,
  }),
  goodsList: css({
    margin: 0,
    paddingLeft: theme.s4,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  goodsItem: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  actionRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    paddingTop: theme.s4,
    borderTop: `1px solid ${color.secondary100}`,
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "background 0.2s, opacity 0.2s",
    "&:hover:not(:disabled)": {
      background: color.secondary500,
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "background 0.2s",
    "&:hover": {
      background: color.neutral50,
    },
  }),
  secondaryActionButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.neutral700,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "background 0.2s",
    "&:hover:not(:disabled)": {
      background: color.neutral50,
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  }),
  rateSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    marginTop: theme.s2,
    padding: theme.s4,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.s3,
    background: color.neutral50,
  }),
  rateSectionTitle: css({
    ...font.boldH5_20,
    color: color.neutral900,
    margin: 0,
  }),
  rateList: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  rateItem: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  rateItemName: css({
    ...font.medium14,
    color: color.neutral800,
  }),
  rateForm: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    alignItems: "center",
  }),
  select: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    backgroundColor: color.neutral0,
    outline: "none",
    "&:focus": {
      borderColor: color.secondary500,
    },
  }),
  input: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    flex: 1,
    minWidth: "200px",
    outline: "none",
    "&:focus": {
      borderColor: color.secondary500,
    },
  }),
  gate: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.neutral100,
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "480px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.medium,
    padding: theme.s6,
  }),
  gateTitle: css({
    ...font.boldH5_20,
    margin: 0,
    color: color.neutral900,
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: 0,
  }),
  paginationContainer: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s4,
    marginTop: theme.s6,
    padding: theme.s4,
  }),
  paginationButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover:not(:disabled)": {
      background: color.secondary100,
      borderColor: color.secondary400,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      borderColor: color.neutral200,
      color: color.neutral400,
    },
  }),
  paginationInfo: css({
    ...font.medium14,
    color: color.neutral700,
    padding: `${theme.s2} ${theme.s3}`,
    minWidth: "200px",
    textAlign: "center",
  }),
  ratingDisplayed: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    padding: theme.s3,
    backgroundColor: color.semantics.success.green50,
    border: `1px solid ${color.semantics.success.green20}`,
    borderRadius: theme.s2,
  }),
  ratingScore: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    ...font.medium14,
  }),
  ratingValue: css({
    marginLeft: theme.s2,
    color: color.neutral700,
    fontWeight: 600,
  }),
  ratingFeedbackText: css({
    ...font.regular14,
    color: color.neutral700,
    fontStyle: "italic",
    marginTop: theme.s1,
  }),
}
