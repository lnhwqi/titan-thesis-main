import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { fadeSlideUp } from "../View/Theme/Keyframe"
import { emit } from "../Runtime/React"
import * as OrderPaymentAction from "../Action/OrderPayment"
import * as ReportAction from "../Action/Report"
import * as ProductRatingReportAction from "../Action/ProductRatingReport"
import * as MessageAction from "../Action/Message"
import { navigateTo, toRoute } from "../Route"
import { OrderPaymentStatus } from "../../../Core/App/OrderPayment/OrderPaymentStatus"
import { formatAddress } from "../../../Core/App/Address"
import { ReportStatus } from "../../../Core/App/Report"
import * as AuthToken from "../App/AuthToken"
import OrderDateFilter from "../View/Part/OrderDateFilter"

type Props = { state: State }

const STATUS_OPTIONS: OrderPaymentStatus[] = [
  "PAID",
  "PACKED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
]

type SellerFilterStatus = "ALL" | OrderPaymentStatus

function toSellerFilterStatus(v: string): SellerFilterStatus {
  const match = FILTER_OPTIONS.find((o) => o.value === v)
  return match !== undefined ? match.value : "ALL"
}

const FILTER_OPTIONS: Array<{ value: SellerFilterStatus; label: string }> = [
  { value: "ALL", label: "All Status" },
  { value: "PAID", label: "Pending" },
  { value: "PACKED", label: "Packed" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "RECEIVED", label: "Received" },
  { value: "REPORTED", label: "Needs Attention" },
  { value: "DELIVERY_ISSUE", label: "Delivery Issue" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function SellerOrdersPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Seller Access Required</h1>
          <p className={styles.gateText}>
            Please log in as a seller to manage orders.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerLogin", {})))}
          >
            Go to Seller Login
          </button>
        </div>
      </div>
    )
  }

  const orders = state.orderPayment.sellerOrders
  const searchQuery = state.orderPayment.sellerOrdersSearchQuery.trim()
  const dateFilter = state.orderPayment.sellerOrdersDateFilter.trim()
  const rawStatus = state.orderPayment.sellerOrdersStatusFilter
  const statusFilter: SellerFilterStatus = toSellerFilterStatus(rawStatus)

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : order.status === statusFilter

    const createdDateText = new Date(order.createdAt.unwrap())
      .toLocaleDateString("en-CA")
      .toLowerCase()
    const matchesDate =
      dateFilter === "" ? true : createdDateText === dateFilter.toLowerCase()

    if (searchQuery === "") {
      return matchesStatus && matchesDate
    }

    const q = searchQuery.toLowerCase()
    return (
      matchesStatus &&
      matchesDate &&
      (order.id.unwrap().toLowerCase().includes(q) ||
        order.username.unwrap().toLowerCase().includes(q) ||
        createdDateText.includes(q))
    )
  })

  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const activeOrders = orders.filter(
    (o) =>
      o.status === "PAID" || o.status === "PACKED" || o.status === "IN_TRANSIT",
  ).length
  const revenueToday = orders
    .filter((o) => o.createdAt.unwrap() >= todayStart)
    .reduce((sum, o) => sum + o.price.unwrap(), 0)
  const CLOSED_REPORT_STATUSES: ReportStatus[] = [
    "RESOLVED",
    "REJECTED",
    "CASHBACK_COMPLETED",
    "REFUND_APPROVED",
  ]
  const needsAttention = orders.filter((o) => {
    if (o.status !== "REPORTED" && o.status !== "DELIVERY_ISSUE") return false
    const report = state.report.sellerReports.find(
      (r) => r.orderID.unwrap() === o.id.unwrap(),
    )
    if (report != null && CLOSED_REPORT_STATUSES.includes(report.status))
      return false
    return true
  }).length

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

      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Seller Workspace</p>
          <h1 className={styles.heroTitle}>Shop Orders</h1>
          <p className={styles.heroSubtitle}>
            Professional order management with compact, searchable workflow.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(OrderPaymentAction.onEnterSellerOrdersRoute())}
          >
            Refresh
          </button>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerShipping", {})))}
          >
            Shipping
          </button>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerReports", {})))}
          >
            Reports
          </button>
          <button
            className={styles.heroSecondaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Active Orders</span>
          <span className={styles.statValue}>{activeOrders}</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Total Revenue Today</span>
          <span className={styles.statValue}>{formatT(revenueToday)}</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Needs Attention</span>
          <span className={styles.statValueAlert}>{needsAttention}</span>
        </article>
      </section>

      <section className={styles.filterBar}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Search</label>
          <input
            className={styles.filterInput}
            value={state.orderPayment.sellerOrdersSearchQuery}
            placeholder="Order ID or customer"
            onChange={(e) =>
              emit(
                OrderPaymentAction.onChangeSellerOrdersSearchQuery(
                  e.currentTarget.value,
                ),
              )
            }
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Status</label>
          <select
            className={styles.filterSelect}
            value={state.orderPayment.sellerOrdersStatusFilter}
            onChange={(e) =>
              emit(
                OrderPaymentAction.onChangeSellerOrdersStatusFilter(
                  e.currentTarget.value,
                ),
              )
            }
          >
            {FILTER_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <OrderDateFilter
          label="Date"
          value={state.orderPayment.sellerOrdersDateFilter}
          onChange={(value) =>
            emit(OrderPaymentAction.onChangeSellerOrdersDateFilter(value))
          }
          onClear={() =>
            emit(OrderPaymentAction.onChangeSellerOrdersDateFilter(""))
          }
        />
      </section>

      {state.orderPayment.sellerOrdersResponse._t === "Loading" ? (
        <div className={styles.info}>Loading shop orders...</div>
      ) : null}

      {filteredOrders.length === 0 &&
      state.orderPayment.sellerOrdersResponse._t === "Success" ? (
        <div className={styles.info}>No orders match your filter.</div>
      ) : null}

      <div className={styles.list}>
        {filteredOrders.map((order) => {
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
                <div className={styles.statusArea}>
                  <div
                    className={styles.statusPill}
                    data-tone={statusTone(currentStatus)}
                  >
                    {displayStatus}
                  </div>
                </div>
                <div className={styles.metaTopRight}>
                  <span className={styles.metaMono}>Order ID: {orderID}</span>
                  <span className={styles.metaMono}>
                    {formatDateTime(order.createdAt.unwrap())}
                  </span>
                </div>
              </div>

              <div className={styles.summaryRail}>
                <div className={styles.finBreakdownCellPrimary}>
                  <span className={styles.summaryLabel}>Net Profit</span>
                  <span className={styles.summaryValue}>
                    {formatT(order.profit.unwrap())}
                  </span>
                </div>
                <div className={styles.finBreakdownCell}>
                  <span className={styles.summaryStatLabel}>Gross</span>
                  <span className={styles.summaryStatValue}>
                    {formatT(order.price.unwrap())}
                  </span>
                </div>
                <div className={styles.finBreakdownCell}>
                  <span className={styles.summaryStatLabel}>Fees</span>
                  <span
                    className={[styles.summaryStatValue, styles.metaFee].join(
                      " ",
                    )}
                  >
                    -{formatT(order.fee.unwrap())}
                  </span>
                </div>
              </div>

              <div className={styles.customerBlock}>
                <div className={styles.customerLine}>
                  <span className={styles.customerTag}>Customer</span>
                  <span className={styles.customerText}>
                    {order.username.unwrap()}
                  </span>
                </div>
                <div className={styles.customerLine}>
                  <span className={styles.addressTag}>Ship to</span>
                  <span className={styles.customerText}>
                    {formatAddress(order.address)}
                  </span>
                </div>
              </div>

              <div className={styles.sectionCard}>
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
              </div>

              {lockedByBuyer ? (
                <div className={styles.actionCenterLocked}>
                  <button
                    className={styles.messageBuyerBtn}
                    onClick={() =>
                      emit(MessageAction.openConversationWithUser(order.userID))
                    }
                  >
                    Message Buyer
                  </button>
                  <div className={styles.noticeBox}>
                    {report != null &&
                    (order.status === "REPORTED" ||
                      order.status === "DELIVERY_ISSUE")
                      ? `Report status: ${humanizeReportStatus(report.status)}`
                      : order.status === "REPORTED"
                        ? "This order is under report review."
                        : "Buyer has completed this delivery flow."}
                  </div>
                </div>
              ) : (
                <div className={styles.actionCenter}>
                  <button
                    className={styles.messageBuyerBtn}
                    onClick={() =>
                      emit(MessageAction.openConversationWithUser(order.userID))
                    }
                  >
                    Message Buyer
                  </button>
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
                  <button
                    className={styles.primaryButton}
                    onClick={() =>
                      emit(OrderPaymentAction.submitTrackingUpdate(orderID))
                    }
                  >
                    Update Status
                  </button>
                </div>
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
                  <details className={styles.moreActions}>
                    <summary className={styles.moreActionsSummary}>
                      More Actions
                    </summary>
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
                  </details>
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

function statusTone(
  status: OrderPaymentStatus,
): "neutral" | "blue" | "green" | "amber" | "red" {
  switch (status) {
    case "PAID":
    case "PACKED":
      return "blue"
    case "IN_TRANSIT":
      return "amber"
    case "DELIVERED":
    case "RECEIVED":
      return "green"
    case "REPORTED":
    case "DELIVERY_ISSUE":
      return "red"
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
    padding: theme.s5,
    background: "#F8FAFC",
    display: "grid",
    gap: theme.s4,
    alignContent: "start",
    animation: `${fadeSlideUp} 0.4s ease both`,
    fontFamily:
      '"Inter", "SF Pro Text", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s6,
    background: `radial-gradient(circle at 10% 15%, rgba(0, 82, 156, 0.08) 0%, transparent 40%), ${color.secondary10}`,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "min(100%, 420px)",
    background: "var(--app-surface-strong)",
    border: "1px solid var(--app-border)",
    borderRadius: theme.s4,
    boxShadow: "var(--app-shadow-lg)",
    padding: theme.s6,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    textAlign: "center",
  }),
  gateTitle: css({ ...font.boldH4_24, margin: 0, color: "var(--app-accent)" }),
  gateText: css({ ...font.regular14, margin: 0, color: color.neutral600 }),
  heroActions: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
    alignItems: "flex-start",
  }),
  statsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s2,
    ...bp.md({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    }),
  }),
  statCard: css({
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: theme.s2,
    display: "grid",
    gap: theme.s1,
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.07)",
  }),
  statLabel: css({
    ...font.medium12,
    color: "#64748B",
  }),
  statValue: css({
    ...font.bold17,
    color: "#334155",
  }),
  statValueAlert: css({
    ...font.bold17,
    color: "#F43F5E",
  }),
  filterBar: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s2,
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: theme.s2,
    ...bp.md({
      gridTemplateColumns: "2fr 1fr 1.2fr",
    }),
  }),
  filterField: css({
    display: "grid",
    gap: theme.s1,
  }),
  filterLabel: css({
    ...font.medium12,
    color: "#64748B",
  }),
  filterInput: css({
    border: "1px solid #CBD5E1",
    borderRadius: theme.s1,
    padding: `${theme.s2} ${theme.s3}`,
    background: "#FFFFFF",
    color: "#334155",
    ...font.regular14,
  }),
  filterSelect: css({
    border: "1px solid #CBD5E1",
    borderRadius: theme.s1,
    padding: `${theme.s2} ${theme.s3}`,
    background: "#FFFFFF",
    color: "#334155",
    ...font.regular14,
  }),
  hero: css({
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.secondary400} 38%, ${color.primary400} 100%)`,
    borderRadius: theme.s4,
    padding: theme.s4,
    boxShadow: "0 16px 36px rgba(0, 82, 156, 0.24)",
    color: color.neutral0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s3,
    flexWrap: "wrap",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.14) 0%, transparent 50%)",
      pointerEvents: "none",
    },
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: color.secondary50,
    marginBottom: theme.s1,
  }),
  heroTitle: css({ ...font.boldH4_24, margin: 0, color: color.neutral0 }),
  heroSubtitle: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.82)",
    marginTop: theme.s1,
  }),
  heroSecondaryButton: css({
    border: `1px solid rgba(255,255,255,0.25)`,
    background: "rgba(255,255,255,0.1)",
    color: color.neutral0,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "rgba(255,255,255,0.18)",
      transform: "translateY(-2px)",
    },
  }),
  list: css({ display: "grid", gap: theme.s1 }),
  card: css({
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: theme.s2,
    display: "grid",
    gap: theme.s1,
    background: "#FFFFFF",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    },
  }),
  topRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  statusArea: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  metaTopRight: css({
    display: "grid",
    gap: 2,
    justifyItems: "end",
  }),
  metaMono: css({
    ...font.regular12,
    color: "#64748B",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  }),
  orderCode: css({
    ...font.bold14,
    color: color.secondary500,
    background: color.secondary50,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
  }),
  statusPill: css({
    ...font.medium12,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    border: "1px solid #CBD5E1",
    color: "#64748B",
    background: "#F1F5F9",
    '&[data-tone="blue"]': {
      color: "#1D4ED8",
      borderColor: "#BFDBFE",
      background: "#EFF6FF",
    },
    '&[data-tone="green"]': {
      color: "#059669",
      borderColor: "#6EE7B7",
      background: "#ECFDF5",
    },
    '&[data-tone="amber"]': {
      color: "#B45309",
      borderColor: "#FCD34D",
      background: "#FFFBEB",
    },
    '&[data-tone="red"]': {
      color: "#BE123C",
      borderColor: "#FECDD3",
      background: "#FFF1F2",
    },
  }),
  summaryRail: css({
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: theme.s2,
    background: "#F9FAFB",
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr",
    gap: 0,
  }),
  finBreakdownCellPrimary: css({
    display: "grid",
    gap: 2,
    padding: `${theme.s1} ${theme.s2}`,
    borderRight: "1px solid #E2E8F0",
  }),
  finBreakdownCell: css({
    display: "grid",
    gap: 2,
    padding: `${theme.s1} ${theme.s2}`,
    borderRight: "1px solid #E2E8F0",
    ":last-child": {
      borderRight: "none",
    },
  }),
  summaryLabel: css({
    ...font.medium12,
    color: "#64748B",
  }),
  summaryValue: css({
    ...font.boldH5_20,
    color: "#10B981",
    lineHeight: 1.1,
  }),
  summaryStatLabel: css({
    ...font.medium12,
    color: "#64748B",
  }),
  summaryStatValue: css({
    ...font.medium14,
    color: "#334155",
  }),
  customerBlock: css({
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "#F9FAFB",
    padding: theme.s2,
    display: "grid",
    gap: theme.s1,
  }),
  customerLine: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  infoIcon: css({
    width: 18,
    height: 18,
    borderRadius: 18,
    border: "1px solid #C7D2FE",
    background: "#EEF2FF",
    color: "#667085",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.medium12,
    flexShrink: 0,
  }),
  customerText: css({
    ...font.regular13,
    color: "#334155",
    wordBreak: "break-word",
  }),
  customerTag: css({
    ...font.medium12,
    color: "#334155",
    borderRadius: 4,
    padding: `1px 6px`,
    flexShrink: 0,
    whiteSpace: "nowrap",
  }),
  addressTag: css({
    ...font.medium12,
    color: "#334155",
    borderRadius: 4,
    padding: `1px 6px`,
    flexShrink: 0,
    whiteSpace: "nowrap",
  }),
  metaFee: css({ color: "#F43F5E" }),
  metaProfit: css({ color: "#10B981", fontWeight: 600 }),
  sectionCard: css({
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "#FFFFFF",
    padding: theme.s2,
  }),
  section: css({ display: "grid", gap: theme.s1 }),
  sectionTitle: css({ ...font.bold14, color: "#334155" }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  rowMuted: css({ ...font.regular14, color: color.genz.purple }),
  rowGoods: css({
    ...font.regular14,
    color: "#475569",
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
    color: "#475569",
    lineHeight: 1.45,
  }),
  actionRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  actionCenter: css({
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "#F9FAFB",
    padding: theme.s2,
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: theme.s2,
    alignItems: "center",
    ...bp.md({
      gridTemplateColumns: "1fr 220px auto",
    }),
  }),
  actionCenterLocked: css({
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "#F9FAFB",
    padding: theme.s2,
    display: "grid",
    gap: theme.s2,
  }),
  select: css({
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    padding: `${theme.s1} ${theme.s2}`,
    background: "#FFFFFF",
    color: "#334155",
    ...font.regular14,
    minHeight: 36,
  }),
  input: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  info: css({
    ...font.regular14,
    color: "#64748B",
    textAlign: "center",
  }),
  notice: css({
    ...font.regular14,
    color: "#64748B",
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
    color: "#64748B",
    padding: 0,
  }),
  ratingReportRow: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  moreActions: css({
    border: `1px solid ${color.neutral200}`,
    borderRadius: theme.s2,
    background: color.neutral50,
    padding: theme.s2,
  }),
  moreActionsSummary: css({
    ...font.medium12,
    color: "#64748B",
    cursor: "pointer",
    listStyle: "none",
    "&::-webkit-details-marker": {
      display: "none",
    },
  }),
  noticeBox: css({
    ...font.regular14,
    color: "#64748B",
    border: "1px dashed #CBD5E1",
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    background: "#FFFFFF",
  }),
  secondaryButton: css({
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#667085",
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#94A3B8",
      background: "#F8FAFC",
    },
  }),
  messageBuyerBtn: css({
    border: "1px solid #C7D2FE",
    background: color.secondary500,
    color: "#E0E7FF",
    borderRadius: 8,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
    justifySelf: "start",
    minHeight: 36,
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#A5B4FC",
      background: "#E0E7FF",
    },
  }),
  primaryButton: css({
    border: "none",
    background: "#1D4ED8",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium14,
    cursor: "pointer",
    minHeight: 36,
    transition: "all 0.2s ease",
    "&:hover": {
      background: "#1E40AF",
      boxShadow: "0 6px 14px rgba(29, 78, 216, 0.25)",
    },
  }),
}
