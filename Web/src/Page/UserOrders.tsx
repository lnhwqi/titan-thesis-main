import { JSX } from "react"
import { css, keyframes } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import { AuthGateCard } from "../View/Part/AuthPageShell"
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
      <div className={styles.page}>
        <div className={styles.shell}>
          <AuthGateCard
            title="My Orders"
            message="Please login to view your orders."
            loginRedirect="/orders"
          />
        </div>
      </div>
    )
  }

  const orders = state.orderPayment.userOrders
  const totalPages =
    Math.ceil(
      state.orderPayment.userOrdersTotalCount /
        state.orderPayment.userOrdersLimit,
    ) || 1
  const totalProducts = state.orderPayment.userOrdersTotalProducts
  const totalMoneyPaid = state.orderPayment.userOrdersTotalMoneyPaid

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Order Journal</p>
            <h1 className={styles.title}>My Orders</h1>
            <p className={styles.subtitle}>
              Track shipments, confirm delivery, and manage product feedback
              from one calm, focused workspace.
            </p>
          </div>

          <div className={styles.heroAside}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Total Orders</span>
                <strong className={styles.metricValue}>
                  {state.orderPayment.userOrdersTotalCount}
                </strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Products</span>
                <strong className={styles.metricValue}>{totalProducts}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Total Paid</span>
                <strong className={styles.metricValue}>
                  {formatT(totalMoneyPaid)}
                </strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Pages</span>
                <strong className={styles.metricValue}>{totalPages}</strong>
              </div>
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
          <div className={styles.infoMeta}>
            You havent placed any orders yet.
          </div>
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
                      <div className={styles.rateSectionTitle}>
                        Rate Products
                      </div>
                      <div className={styles.rateList}>
                        {order.items.map((item) => {
                          const key = `${orderID}:${item.productID.unwrap()}`
                          const userRating =
                            state.productRating.userRatings[key]
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
                                              ? color.semantics.warning
                                                  .yellow500
                                              : color.genz.purple300,
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
            Page {state.orderPayment.userOrdersPage} of {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            disabled={state.orderPayment.userOrdersPage >= totalPages}
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
    "--orders-bg": "var(--app-bg)",
    "--orders-surface": "var(--app-surface)",
    "--orders-surface-strong": "var(--app-surface-strong)",
    "--orders-border": "var(--app-border)",
    "--orders-border-strong": "var(--app-border-strong)",
    "--orders-text": "var(--app-text)",
    "--orders-muted": "var(--app-text-soft)",
    "--orders-accent": "var(--app-accent)",
    "--orders-accent-soft": "var(--app-accent-soft)",
    "--orders-success-bg": "var(--app-success-20)",
    "--orders-success-text": "var(--app-success-500)",
    "--orders-info-bg": "var(--app-info-20)",
    "--orders-info-text": "var(--app-info-500)",
    "--orders-shadow": "var(--app-shadow-md)",
    minHeight: "100dvh",
    padding: `${theme.s5} ${theme.s3}`,
    background:
      "radial-gradient(circle at top left, rgba(255,255,255,0.84), transparent 36%), radial-gradient(circle at 88% 12%, rgba(0, 82, 156, 0.10), transparent 24%), linear-gradient(180deg, var(--orders-bg) 0%, #eef5fb 100%)",
    color: "var(--orders-text)",
    fontFamily:
      '"SF Pro Display", "Neue Haas Grotesk Text Pro", "Helvetica Neue", sans-serif',
    ...bp.md({
      padding: `${theme.s8} ${theme.s6}`,
    }),
  }),
  shell: css({
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: theme.s5,
    ...bp.md({
      gap: theme.s6,
    }),
  }),
  hero: css({
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: theme.s5,
    padding: `${theme.s6} ${theme.s5}`,
    borderRadius: "32px",
    border: "1px solid var(--orders-border)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(249, 244, 236, 0.68))",
    boxShadow: "var(--orders-shadow)",
    backdropFilter: "blur(18px)",
    overflow: "hidden",
    animation: `${slideDown} 0.45s ease-out`,
    "&::after": {
      content: '""',
      position: "absolute",
      inset: "auto -8% -50% auto",
      width: "280px",
      height: "280px",
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(255,255,255,0.72), transparent 68%)",
      pointerEvents: "none",
    },
    ...bp.sm({
      flexDirection: "column",
    }),
    ...bp.md({
      padding: `${theme.s7} ${theme.s7}`,
    }),
  }),
  heroContent: css({
    position: "relative",
    zIndex: 1,
    flex: 1,
    minWidth: 0,
  }),
  heroAside: css({
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "400px",
    display: "grid",
    gap: theme.s4,
    ...bp.sm({
      maxWidth: "100%",
    }),
  }),
  eyebrow: css({
    margin: 0,
    marginBottom: theme.s2,
    color: "var(--orders-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    fontSize: "12px",
    fontWeight: 600,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
    color: "var(--orders-text)",
    letterSpacing: "-0.04em",
    lineHeight: 1,
    maxWidth: "10ch",
  }),
  subtitle: css({
    ...font.regular17,
    color: "var(--orders-muted)",
    marginTop: theme.s3,
    marginBottom: 0,
    maxWidth: "56ch",
    lineHeight: 1.75,
  }),
  metricsGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.s3,
  }),
  metricCard: css({
    display: "grid",
    gap: theme.s1,
    padding: `${theme.s4} ${theme.s4}`,
    borderRadius: "22px",
    border: "1px solid var(--orders-border)",
    background: "var(--orders-surface)",
    backdropFilter: "blur(14px)",
    transition:
      "transform 220ms ease, border-color 220ms ease, background 220ms ease",
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: "var(--orders-border-strong)",
      background: "var(--orders-surface-strong)",
    },
  }),
  metricLabel: css({
    ...font.medium12,
    color: "var(--orders-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
  }),
  metricValue: css({
    fontSize: "clamp(1.35rem, 2vw, 2rem)",
    lineHeight: 1.1,
    fontWeight: 600,
    color: "var(--orders-text)",
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s3,
    flexWrap: "wrap",
  }),
  flashContainer: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
  }),
  flashBannerSuccess: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.s3,
    padding: `${theme.s4} ${theme.s5}`,
    backgroundColor: "var(--orders-success-bg)",
    border: "1px solid rgba(35, 84, 61, 0.16)",
    borderRadius: "22px",
    color: "var(--orders-success-text)",
    ...font.medium14,
    boxShadow: "0 10px 30px rgba(35, 84, 61, 0.08)",
    animation: `${slideDown} 0.3s ease-out`,
  }),
  flashBannerInfo: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.s3,
    padding: `${theme.s4} ${theme.s5}`,
    backgroundColor: "var(--orders-info-bg)",
    border: "1px solid rgba(89, 77, 58, 0.14)",
    borderRadius: "22px",
    color: "var(--orders-info-text)",
    ...font.medium14,
    boxShadow: "0 10px 30px rgba(89, 77, 58, 0.08)",
    animation: `${slideDown} 0.3s ease-out`,
  }),
  dismissBtn: css({
    border: "none",
    background: "transparent",
    cursor: "pointer",
    ...font.medium14,
    color: "inherit",
    padding: theme.s2,
    opacity: 0.7,
    borderRadius: "999px",
    transition: "opacity 0.2s ease, background 0.2s ease",
    "&:hover": {
      opacity: 1,
      background: "rgba(255,255,255,0.32)",
    },
  }),
  infoMeta: css({
    ...font.regular14,
    color: "var(--orders-muted)",
    padding: `${theme.s6} ${theme.s5}`,
    textAlign: "center",
    background: "var(--orders-surface-strong)",
    borderRadius: "26px",
    border: "1px dashed var(--orders-border-strong)",
    backdropFilter: "blur(12px)",
  }),
  list: css({
    display: "grid",
    gap: theme.s4,
    ...bp.md({
      gap: theme.s5,
    }),
  }),
  card: css({
    background: "var(--orders-surface-strong)",
    border: "1px solid var(--orders-border)",
    borderRadius: "30px",
    overflow: "hidden",
    boxShadow: "0 10px 34px rgba(38, 34, 29, 0.07)",
    backdropFilter: "blur(14px)",
    transition:
      "transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 22px 60px rgba(38, 34, 29, 0.12)",
      borderColor: "var(--orders-border-strong)",
    },
  }),
  cardHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${theme.s4} ${theme.s5}`,
    background:
      "linear-gradient(180deg, rgba(248, 244, 238, 0.85), rgba(255,255,255,0.3))",
    borderBottom: "1px solid var(--orders-border)",
    flexWrap: "wrap",
    gap: theme.s3,
  }),
  headerLeft: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    minWidth: 0,
    flexWrap: "wrap",
  }),
  orderIdLabel: css({
    ...font.medium14,
    color: "var(--orders-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  }),
  orderIdValue: css({
    ...font.bold14,
    color: "var(--orders-text)",
    letterSpacing: "0.01em",
  }),
  statusPill: css({
    display: "inline-block",
    padding: `${theme.s2} ${theme.s3}`,
    background: "var(--orders-accent-soft)",
    color: "var(--orders-accent)",
    borderRadius: "999px",
    border: "1px solid rgba(34, 34, 34, 0.08)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  }),
  cardBody: css({
    padding: `${theme.s5} ${theme.s5}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s5,
    ...bp.md({
      padding: `${theme.s6} ${theme.s6}`,
    }),
  }),
  detailsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.sm({
      gridTemplateColumns: "1fr 1fr",
    }),
    ...bp.md({
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: theme.s4,
    }),
  }),
  detailItem: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    padding: `${theme.s3} ${theme.s3}`,
    borderRadius: "20px",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(108, 92, 70, 0.08)",
  }),
  detailItemFull: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    gridColumn: "1 / -1",
    padding: `${theme.s3} ${theme.s3}`,
    borderRadius: "20px",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(108, 92, 70, 0.08)",
  }),
  detailLabel: css({
    ...font.medium12,
    color: "var(--orders-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  }),
  detailValue: css({
    ...font.regular14,
    color: "var(--orders-text)",
    lineHeight: 1.65,
  }),
  detailValuePrice: css({
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "var(--orders-accent)",
    letterSpacing: "-0.03em",
  }),
  itemsSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    paddingTop: theme.s4,
    borderTop: "1px dashed var(--orders-border-strong)",
  }),
  goodsList: css({
    margin: 0,
    paddingLeft: theme.s4,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  goodsItem: css({
    ...font.regular14,
    color: "var(--orders-text)",
    lineHeight: 1.6,
  }),
  actionRow: css({
    display: "flex",
    gap: theme.s3,
    flexWrap: "wrap",
    paddingTop: theme.s4,
    borderTop: "1px solid var(--orders-border)",
  }),
  primaryButton: css({
    border: "1px solid transparent",
    background: "var(--orders-accent)",
    color: "#fbf9f4",
    borderRadius: "999px",
    padding: `${theme.s3} ${theme.s5}`,
    ...font.medium14,
    cursor: "pointer",
    transition:
      "transform 220ms ease, box-shadow 220ms ease, opacity 220ms ease, background 220ms ease",
    boxShadow: "0 12px 26px rgba(34, 34, 34, 0.18)",
    "&:hover:not(:disabled)": {
      transform: "translateY(-1px)",
      background: "#111111",
      boxShadow: "0 16px 32px rgba(17, 17, 17, 0.22)",
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
      boxShadow: "none",
    },
  }),
  secondaryButton: css({
    border: "1px solid var(--orders-border-strong)",
    background: "rgba(255,255,255,0.58)",
    color: "var(--orders-text)",
    borderRadius: "999px",
    padding: `${theme.s3} ${theme.s5}`,
    ...font.medium14,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    transition:
      "transform 220ms ease, background 220ms ease, border-color 220ms ease",
    "&:hover": {
      transform: "translateY(-1px)",
      background: "rgba(255,255,255,0.86)",
      borderColor: "rgba(108, 92, 70, 0.24)",
    },
  }),
  secondaryActionButton: css({
    border: "1px solid var(--orders-border-strong)",
    background: "rgba(255,255,255,0.7)",
    color: "var(--orders-text)",
    borderRadius: "999px",
    padding: `${theme.s3} ${theme.s5}`,
    ...font.medium14,
    cursor: "pointer",
    transition:
      "transform 220ms ease, background 220ms ease, border-color 220ms ease, opacity 220ms ease",
    "&:hover:not(:disabled)": {
      transform: "translateY(-1px)",
      background: "rgba(255,255,255,0.92)",
      borderColor: "rgba(108, 92, 70, 0.24)",
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
    padding: theme.s5,
    border: "1px solid var(--orders-border)",
    borderRadius: "26px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(245, 240, 232, 0.62))",
  }),
  rateSectionTitle: css({
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--orders-text)",
    margin: 0,
    letterSpacing: "-0.02em",
  }),
  rateList: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  rateItem: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    paddingTop: theme.s3,
    borderTop: "1px solid rgba(108, 92, 70, 0.08)",
    "&:first-child": {
      paddingTop: 0,
      borderTop: "none",
    },
  }),
  rateItemName: css({
    ...font.medium14,
    color: "var(--orders-text)",
  }),
  rateForm: css({
    display: "flex",
    gap: theme.s3,
    flexWrap: "wrap",
    alignItems: "center",
  }),
  select: css({
    border: "1px solid var(--orders-border-strong)",
    borderRadius: "18px",
    padding: `${theme.s3} ${theme.s4}`,
    ...font.regular14,
    backgroundColor: "rgba(255,255,255,0.86)",
    outline: "none",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
    "&:focus": {
      borderColor: "rgba(34,34,34,0.2)",
      boxShadow: "0 0 0 4px rgba(34,34,34,0.06)",
    },
  }),
  input: css({
    border: "1px solid var(--orders-border-strong)",
    borderRadius: "18px",
    padding: `${theme.s3} ${theme.s4}`,
    ...font.regular14,
    flex: 1,
    minWidth: "200px",
    outline: "none",
    backgroundColor: "rgba(255,255,255,0.86)",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
    "&:focus": {
      borderColor: "rgba(34,34,34,0.2)",
      boxShadow: "0 0 0 4px rgba(34,34,34,0.06)",
    },
  }),
  paginationContainer: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s3,
    marginTop: theme.s2,
    padding: `${theme.s4} ${theme.s4}`,
    borderRadius: "999px",
    background: "rgba(255,255,255,0.46)",
    border: "1px solid var(--orders-border)",
    backdropFilter: "blur(12px)",
    flexWrap: "wrap",
  }),
  paginationButton: css({
    border: "1px solid var(--orders-border-strong)",
    background: "rgba(255,255,255,0.76)",
    color: "var(--orders-text)",
    borderRadius: "999px",
    padding: `${theme.s3} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition:
      "transform 220ms ease, background 220ms ease, border-color 220ms ease, color 220ms ease",
    "&:hover:not(:disabled)": {
      transform: "translateY(-1px)",
      background: "rgba(255,255,255,0.96)",
      borderColor: "rgba(108, 92, 70, 0.22)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      borderColor: "rgba(108, 92, 70, 0.08)",
      color: "rgba(109, 103, 93, 0.7)",
    },
  }),
  paginationInfo: css({
    ...font.medium14,
    color: "var(--orders-muted)",
    padding: `${theme.s2} ${theme.s3}`,
    minWidth: "180px",
    textAlign: "center",
  }),
  ratingDisplayed: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    padding: theme.s3,
    backgroundColor: "rgba(223, 240, 229, 0.72)",
    border: "1px solid rgba(35, 84, 61, 0.10)",
    borderRadius: "18px",
  }),
  ratingScore: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    ...font.medium14,
  }),
  ratingValue: css({
    marginLeft: theme.s2,
    color: "var(--orders-muted)",
    fontWeight: 600,
  }),
  ratingFeedbackText: css({
    ...font.regular14,
    color: "var(--orders-muted)",
    fontStyle: "italic",
    marginTop: theme.s1,
  }),
}
