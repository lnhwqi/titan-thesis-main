import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { color, font, theme, bp } from "../View/Theme"
import * as AdminDashboardAction from "../Action/Admin"
import AdminSellerModerationPanel from "../View/AdminSellerModerationPanel"

type Props = { state: State }

export default function AdminSellerModerationPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const pending = state.adminDashboard.pendingSellersResponse
  const approving = state.adminDashboard.approvingSellerIDs
  const sendingVerifyEmail = state.adminDashboard.sendingVerifyEmailSellerIDs
  const allSellers = state.adminDashboard.allSellersResponse
  const filter = state.adminDashboard.sellerModerationFilter

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to manage sellers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Seller Moderation</h1>
          <p className={styles.subtitle}>
            Track seller verification, review pending approvals, and monitor all
            sellers.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.goToAdminDashboard())}
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>New Seller Registration List</h2>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(AdminDashboardAction.loadPendingSellers())}
        >
          Refresh queue
        </button>

        {renderPendingSellers(pending, approving, sendingVerifyEmail)}
      </section>

      <section className={styles.panelWide}>
        <AdminSellerModerationPanel
          sellersResponse={allSellers}
          filterBy={filter}
          onFilterChange={(newFilter) =>
            emit(AdminDashboardAction.changeSellerModerationFilter(newFilter))
          }
        />
        <button
          className={styles.refreshButton}
          onClick={() => emit(AdminDashboardAction.loadAllSellers())}
        >
          Refresh All Sellers
        </button>
      </section>
    </div>
  )
}

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
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    marginBottom: theme.s6,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    marginTop: theme.s2,
  }),
  panel: css({
    height: "80dvh",
    background: color.neutral0,
    borderRadius: theme.s4,
    border: `1px solid ${color.secondary100}`,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  panelWide: css({
    background: color.neutral0,
    borderRadius: theme.s4,
    border: `1px solid ${color.secondary100}`,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  refreshButton: css({
    marginTop: theme.s4,
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    marginTop: 0,
    marginBottom: theme.s4,
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
    marginBottom: theme.s4,
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
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
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: 0,
  }),
  modalOverlay: css({
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(18,24,38,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s4,
  }),
  modalCard: css({
    width: "100%",
    maxWidth: "460px",
    background: color.neutral0,
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary200}`,
    padding: theme.s4,
    boxShadow: theme.elevation.large,
  }),
  modalTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  modalText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: theme.s3,
  }),
  modalButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  sellerList: css({
    marginTop: theme.s2,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  sellerItem: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    background: color.secondary50,
    padding: theme.s3,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  sellerMeta: css({
    ...font.regular13,
    color: color.neutral700,
  }),
  sellerItemAction: css({
    marginTop: theme.s1,
    border: "none",
    borderRadius: theme.s2,
    background: color.secondary500,
    color: color.neutral0,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
    width: "fit-content",
  }),
  sellerItemActionDisabled: css({
    opacity: 0.6,
    cursor: "not-allowed",
  }),
}

function renderPendingSellers(
  pending: State["adminDashboard"]["pendingSellersResponse"],
  approving: string[],
  sendingVerifyEmail: string[],
): JSX.Element {
  switch (pending._t) {
    case "NotAsked":
      return <div className={styles.sellerMeta}>No data loaded yet.</div>
    case "Loading":
      return <div className={styles.sellerMeta}>Loading pending sellers...</div>
    case "Failure":
      return (
        <div className={styles.sellerMeta}>Failed to load pending sellers.</div>
      )
    case "Success": {
      if (pending.data.sellers.length === 0) {
        return (
          <div className={styles.sellerMeta}>
            No sellers waiting for approval.
          </div>
        )
      }

      return (
        <div className={styles.sellerList}>
          {pending.data.sellers.map((seller) => {
            const id = seller.id.unwrap()
            const isApproving = approving.includes(id)
            const isSendingVerifyEmail = sendingVerifyEmail.includes(id)
            return (
              <div
                key={id}
                className={styles.sellerItem}
              >
                <strong>{seller.shopName.unwrap()}</strong>
                <div className={styles.sellerMeta}>
                  Owner: {seller.name.unwrap()}
                </div>
                <div className={styles.sellerMeta}>
                  Email: {seller.email.unwrap()}
                </div>
                <button
                  className={`${styles.sellerItemAction} ${
                    isSendingVerifyEmail ? styles.sellerItemActionDisabled : ""
                  }`}
                  disabled={isSendingVerifyEmail}
                  onClick={() =>
                    emit(AdminDashboardAction.sendVerifyEmail(seller.id))
                  }
                >
                  {isSendingVerifyEmail
                    ? "Sending verify email..."
                    : "Send Verify Email"}
                </button>
                <button
                  className={`${styles.sellerItemAction} ${
                    isApproving ? styles.sellerItemActionDisabled : ""
                  }`}
                  disabled={isApproving}
                  onClick={() =>
                    emit(AdminDashboardAction.approveSeller(seller.id))
                  }
                >
                  {isApproving ? "Approving..." : "Approve Seller"}
                </button>
              </div>
            )
          })}
        </div>
      )
    }
  }
}
