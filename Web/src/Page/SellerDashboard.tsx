import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as LoginAction from "../Action/Login"
import * as SellerDashboardAction from "../Action/SellerDashboard"
import * as OrderPaymentAction from "../Action/OrderPayment"
import InputText from "../View/Form/InputText"

export type Props = { state: State }

export default function SellerDashboardPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Seller Access Required</h1>
          <p className={styles.gateText}>
            Please log in as seller to access this dashboard.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerLogin", {})))}
          >
            Go to seller login
          </button>
        </div>
      </div>
    )
  }

  const myProducts =
    state.product.listResponse._t === "Success"
      ? state.product.listResponse.data.items.filter(
          (item) => item.sellerID.unwrap() === auth.sellerID.unwrap(),
        )
      : []

  const myProductsCount = myProducts.length
  const sellerState = state.sellerDashboard
  const seller =
    sellerState.profileResponse._t === "Success"
      ? sellerState.profileResponse.data.seller
      : null

  const accountStatus =
    seller == null
      ? "Loading"
      : seller.active.unwrap() === false
        ? "Inactive"
        : seller.verified.unwrap() === false
          ? "Pending Verification"
          : seller.vacationMode.unwrap() === true
            ? "Vacation Mode"
            : "Active"

  return (
    <div className={styles.page}>
      {sellerState.flashMessage != null ? (
        <div className={styles.announceOverlay}>
          <div className={styles.announceCard}>
            <h3 className={styles.announceTitle}>Notice</h3>
            <p className={styles.announceText}>{sellerState.flashMessage}</p>
            <button
              className={styles.primaryButton}
              onClick={() => emit(SellerDashboardAction.clearFlashMessage())}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Seller Workspace</p>
          <h1 className={styles.title}>Seller Dashboard</h1>
          <p className={styles.subtitle}>
            Manage your shop profile and products from one place.
          </p>
          <div className={styles.quickActions}>
            <button
              className={styles.secondaryButton}
              onClick={() =>
                emit(SellerDashboardAction.goToCreateProductPage())
              }
            >
              Create Product Page
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() =>
                emit(SellerDashboardAction.goToCreateVoucherPage())
              }
            >
              Create Voucher Page
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => emit(SellerDashboardAction.goToShippingPage())}
            >
              Shipping Tracker
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => emit(OrderPaymentAction.goToSellerOrdersPage())}
            >
              Manage Orders
            </button>
          </div>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => emit(LoginAction.logout())}
        >
          Logout
        </button>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeaderRow}>
          <div>
            <h2 className={styles.panelTitle}>Shop Profile</h2>
            <p className={styles.panelDescription}>
              Set your shop identity shown to customers.
            </p>
          </div>

          {sellerState.isEditingShop ? (
            <div className={styles.inlineActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => emit(SellerDashboardAction.cancelEditShop())}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => emit(SellerDashboardAction.submitShopProfile())}
              >
                Save
              </button>
            </div>
          ) : (
            <button
              className={styles.secondaryButton}
              onClick={() => emit(SellerDashboardAction.startEditShop())}
            >
              Edit Shop
            </button>
          )}
        </div>

        <div className={styles.topGrid}>
          <div className={styles.field}>
            <span className={styles.label}>Shop Name</span>
            <InputText
              value={sellerState.shopName}
              invalid={false}
              type="text"
              placeholder="Your shop name"
              disabled={!sellerState.isEditingShop}
              onChange={(v) => emit(SellerDashboardAction.onChangeShopName(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Shop Description</span>
            <InputText
              value={sellerState.shopDescription}
              invalid={false}
              type="text"
              placeholder="Tell customers what you sell"
              disabled={!sellerState.isEditingShop}
              onChange={(v) =>
                emit(SellerDashboardAction.onChangeShopDescription(v))
              }
            />
          </div>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Account Status</div>
          <div className={styles.statValue}>{accountStatus}</div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>My Products</div>
          <div className={styles.statValue}>{myProductsCount}</div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Total Products Sold</div>
          <div className={styles.statValue}>
            {sellerState.totalProductsSold}
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Revenue</div>
          <div className={styles.statValue}>
            {formatCurrency(seller?.revenue.unwrap() ?? 0)}
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Profit</div>
          <div className={styles.statValue}>
            {formatCurrency(seller?.profit.unwrap() ?? 0)}
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Withdrawn</div>
          <div className={styles.statValue}>
            {formatCurrency(seller?.withdrawn.unwrap() ?? 0)}
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Tier And Tax</div>
          <div className={styles.tierRow}>
            <span className={styles.tierPill}>
              {formatTier(seller?.tier.unwrap() ?? "bronze")}
            </span>
            <span className={styles.taxValue}>
              Tax: {seller?.tax.unwrap() ?? 0}%
            </span>
          </div>
          <div className={styles.tierHint}>
            {buildTierUpgradeHint(
              seller?.tier.unwrap() ?? "bronze",
              seller?.profit.unwrap() ?? 0,
              sellerState.profileResponse._t === "Success"
                ? sellerState.profileResponse.data.sellerTierPolicy
                : null,
            )}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Shop Product List</h2>
        <p className={styles.panelDescription}>
          All products currently published under your seller account.
        </p>

        {state.product.listResponse._t === "Loading" ? (
          <div className={styles.emptyText}>Loading your products...</div>
        ) : null}

        {state.product.listResponse._t === "Failure" ? (
          <div className={styles.emptyText}>
            Could not load products. Please refresh this page.
          </div>
        ) : null}

        {state.product.listResponse._t === "Success" &&
        myProducts.length === 0 ? (
          <div className={styles.emptyText}>
            You have not created any products yet.
          </div>
        ) : null}

        {state.product.listResponse._t === "Success" &&
        myProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {myProducts.map((product) => {
              const firstVariant = product.variants[0]
              return (
                <article
                  key={product.id.unwrap()}
                  className={styles.productCard}
                >
                  <div className={styles.productName}>
                    {product.name.unwrap()}
                  </div>
                  <div className={styles.productMeta}>
                    Price: {formatCurrency(product.price.unwrap())}
                  </div>
                  <div className={styles.productMeta}>
                    SKU: {firstVariant?.sku.unwrap() ?? "-"}
                  </div>
                  <div className={styles.productMeta}>
                    Stock: {firstVariant?.stock.unwrap() ?? 0}
                  </div>
                  <div className={styles.productActions}>
                    <button
                      type="button"
                      className={styles.editProductButton}
                      onClick={() =>
                        emit(SellerDashboardAction.editProduct(product.id))
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.deleteProductButton}
                      onClick={() =>
                        emit(SellerDashboardAction.deleteProduct(product.id))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>

      {sellerState.pendingDeleteProductId != null ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmCard}>
            <h3 className={styles.confirmTitle}>Confirm Delete</h3>
            <p className={styles.confirmText}>
              Delete {sellerState.pendingDeleteProductName ?? "this product"}?
              This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  emit(SellerDashboardAction.cancelDeleteProduct())
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteProductButton}
                onClick={() =>
                  emit(SellerDashboardAction.confirmDeleteProduct())
                }
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatCurrency(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function formatTier(value: "bronze" | "silver" | "gold"): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function buildTierUpgradeHint(
  tier: "bronze" | "silver" | "gold",
  profit: number,
  policy: null | {
    silverProfitThreshold: { unwrap(): number }
    goldProfitThreshold: { unwrap(): number }
  },
): string {
  if (policy == null) {
    return "Loading tier policy..."
  }

  if (tier === "bronze") {
    const need = Math.max(0, policy.silverProfitThreshold.unwrap() - profit)
    return need === 0
      ? "You reached silver threshold. Refresh to sync your tier."
      : `Need ${formatCurrency(need)} profit to upgrade to Silver.`
  }

  if (tier === "silver") {
    const need = Math.max(0, policy.goldProfitThreshold.unwrap() - profit)
    return need === 0
      ? "You reached gold threshold. Refresh to sync your tier."
      : `Need ${formatCurrency(need)} profit to upgrade to Gold.`
  }

  return "You are at the highest tier (Gold)."
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 15% 20%, ${color.secondary100} 0%, transparent 35%),` +
      `radial-gradient(circle at 85% 10%, ${color.secondary200} 0%, transparent 30%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
    display: "grid",
    gap: theme.s5,
    position: "relative",
  }),
  announceOverlay: css({
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: theme.s4,
  }),
  announceCard: css({
    width: "100%",
    maxWidth: "420px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.large,
    padding: theme.s5,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    textAlign: "center",
  }),
  announceTitle: css({
    ...font.boldH4_24,
    margin: 0,
    color: color.secondary500,
  }),
  announceText: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral700,
    whiteSpace: "pre-wrap",
  }),
  hero: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: color.secondary500,
    marginBottom: theme.s1,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
  }),
  quickActions: css({
    marginTop: theme.s3,
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  panel: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.large,
  }),
  panelHeaderRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s3,
    marginBottom: theme.s4,
    flexWrap: "wrap",
  }),
  panelTitle: css({
    ...font.boldH4_24,
    margin: 0,
    marginBottom: theme.s1,
  }),
  panelDescription: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
    marginBottom: theme.s4,
  }),
  inlineActions: css({
    display: "flex",
    gap: theme.s2,
  }),
  topGrid: css({
    display: "grid",
    gap: theme.s3,
    gridTemplateColumns: "1fr",
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  label: css({
    ...font.regular14,
    color: color.neutral700,
  }),
  statsGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.md({
      gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    }),
  }),
  statCard: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    boxShadow: theme.elevation.medium,
  }),
  statLabel: css({
    ...font.regular12,
    color: color.neutral600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: theme.s1,
  }),
  statValue: css({
    ...font.boldH5_20,
    color: color.secondary500,
  }),
  tierRow: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  tierPill: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.s3,
    padding: `2px ${theme.s2}`,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary50,
    color: color.secondary500,
    ...font.bold12,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  }),
  taxValue: css({
    ...font.bold14,
    color: color.secondary500,
  }),
  tierHint: css({
    marginTop: theme.s2,
    ...font.regular12,
    color: color.neutral600,
  }),
  productGrid: css({
    marginTop: theme.s2,
    display: "grid",
    gap: theme.s3,
    gridTemplateColumns: "1fr",
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  productCard: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s3,
    padding: theme.s3,
    background: color.neutral0,
  }),
  productName: css({
    ...font.bold14,
    color: color.neutral900,
    marginBottom: theme.s2,
  }),
  productMeta: css({
    ...font.regular14,
    color: color.neutral700,
  }),
  productActions: css({
    marginTop: theme.s3,
    display: "flex",
    gap: theme.s2,
    justifyContent: "flex-end",
  }),
  editProductButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    cursor: "pointer",
  }),
  deleteProductButton: css({
    border: `1px solid ${color.semantics.error.red500}`,
    background: color.semantics.error.red50,
    color: color.semantics.error.red500,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    cursor: "pointer",
  }),
  emptyText: css({
    ...font.regular14,
    color: color.neutral700,
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
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: color.neutral100,
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "520px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s6,
    boxShadow: theme.elevation.large,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    alignItems: "flex-start",
  }),
  gateTitle: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
  modalBackdrop: css({
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: theme.s4,
  }),
  confirmCard: css({
    width: "100%",
    maxWidth: "420px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.large,
    padding: theme.s5,
  }),
  confirmTitle: css({
    ...font.bold14,
    color: color.neutral900,
    margin: 0,
    marginBottom: theme.s2,
  }),
  confirmText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
  confirmActions: css({
    marginTop: theme.s4,
    display: "flex",
    gap: theme.s2,
    justifyContent: "flex-end",
  }),
}
