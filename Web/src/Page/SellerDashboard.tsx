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
import { fadeSlideUp } from "../View/Theme/Keyframe"

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
              className={styles.heroSecondaryButton}
              onClick={() =>
                emit(SellerDashboardAction.goToCreateProductPage())
              }
            >
              Create Product Page
            </button>
            <button
              className={styles.heroSecondaryButton}
              onClick={() =>
                emit(SellerDashboardAction.goToCreateVoucherPage())
              }
            >
              Create Voucher Page
            </button>
            <button
              className={styles.heroSecondaryButton}
              onClick={() => emit(SellerDashboardAction.goToShippingPage())}
            >
              Shipping Tracker
            </button>
            <button
              className={styles.heroSecondaryButton}
              onClick={() => emit(OrderPaymentAction.goToSellerOrdersPage())}
            >
              Manage Orders
            </button>
          </div>
        </div>
        <button
          className={styles.heroPrimaryButton}
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
          <div className={styles.statLabel}>Wallet</div>
          <div className={styles.statValue}>
            {formatCurrency(seller?.wallet.unwrap() ?? 0)}
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
    background: `radial-gradient(circle at 10% 15%, rgba(124, 58, 237, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(236, 72, 153, 0.06) 0%, transparent 35%), ${color.neutral10}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
    display: "grid",
    gap: theme.s5,
    position: "relative",
    animation: `${fadeSlideUp} 0.4s ease both`,
  }),
  announceOverlay: css({
    position: "fixed",
    inset: 0,
    background: "rgba(15, 15, 26, 0.65)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: theme.s4,
  }),
  announceCard: css({
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(16px)",
    border: `1px solid rgba(124, 58, 237, 0.2)`,
    borderRadius: theme.s4,
    boxShadow: "0 24px 64px rgba(124, 58, 237, 0.25)",
    padding: theme.s5,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    textAlign: "center",
  }),
  announceTitle: css({
    ...font.boldH4_24,
    margin: 0,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
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
    background: `linear-gradient(135deg, ${color.genz.dark} 0%, #1A1A2E 40%, #2D1B69 70%, #4C0066 100%)`,
    borderRadius: theme.s4,
    padding: theme.s6,
    boxShadow: "0 8px 32px rgba(124, 58, 237, 0.3), 0 0 0 1px rgba(124, 58, 237, 0.2)",
    color: color.neutral0,
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 75% 25%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 40%)",
      pointerEvents: "none",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      top: "-1px",
      left: "10%",
      right: "10%",
      height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
    },
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: color.genz.cyanLight,
    marginBottom: theme.s1,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
    color: color.neutral0,
    letterSpacing: "-1px",
  }),
  subtitle: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.75)",
    marginTop: theme.s2,
  }),
  quickActions: css({
    marginTop: theme.s3,
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  heroSecondaryButton: css({
    border: `1px solid rgba(255,255,255,0.25)`,
    background: "rgba(255,255,255,0.08)",
    color: color.neutral0,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    transition: "all 0.22s ease",
    "&:hover": {
      background: "rgba(255,255,255,0.16)",
      borderColor: "rgba(255,255,255,0.5)",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 16px rgba(124, 58, 237, 0.3)",
    },
  }),
  heroPrimaryButton: css({
    border: `1px solid rgba(255,107,107,0.4)`,
    background: "rgba(255,107,107,0.15)",
    color: color.genz.coral,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.22s ease",
    "&:hover": {
      background: "rgba(255,107,107,0.25)",
      borderColor: "rgba(255,107,107,0.6)",
      transform: "translateY(-2px)",
    },
  }),
  panel: css({
    background: color.neutral0,
    border: `1.5px solid rgba(124, 58, 237, 0.1)`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.07)",
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
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }),
  panelDescription: css({
    ...font.regular14,
    color: color.neutral600,
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
    color: color.neutral600,
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
    borderRadius: theme.s3,
    borderTop: `3px solid transparent`,
    backgroundImage: `linear-gradient(${color.neutral0}, ${color.neutral0}), linear-gradient(135deg, ${color.genz.purple}, ${color.genz.pink})`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    border: "1.5px solid transparent",
    padding: theme.s4,
    boxShadow: "0 2px 12px rgba(124, 58, 237, 0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(124, 58, 237, 0.18)",
    },
  }),
  statLabel: css({
    ...font.regular12,
    color: color.neutral500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: theme.s1,
  }),
  statValue: css({
    ...font.boldH5_20,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
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
    borderRadius: theme.brFull,
    padding: `2px ${theme.s3}`,
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    ...font.bold12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
  }),
  taxValue: css({
    ...font.bold14,
    color: color.genz.purple,
  }),
  tierHint: css({
    marginTop: theme.s2,
    ...font.regular12,
    color: color.neutral500,
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
    border: `1.5px solid rgba(124, 58, 237, 0.12)`,
    borderRadius: theme.s3,
    padding: theme.s3,
    background: color.neutral0,
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
    "&:hover": {
      borderColor: "rgba(124, 58, 237, 0.3)",
      boxShadow: "0 4px 16px rgba(124, 58, 237, 0.1)",
    },
  }),
  productName: css({
    ...font.bold14,
    color: color.neutral900,
    marginBottom: theme.s2,
  }),
  productMeta: css({
    ...font.regular14,
    color: color.neutral600,
  }),
  productActions: css({
    marginTop: theme.s3,
    display: "flex",
    gap: theme.s2,
    justifyContent: "flex-end",
  }),
  editProductButton: css({
    border: `1px solid rgba(124, 58, 237, 0.3)`,
    background: "rgba(124, 58, 237, 0.05)",
    color: color.genz.purple,
    borderRadius: theme.br5,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    cursor: "pointer",
    transition: "all 0.18s ease",
    "&:hover": {
      background: color.genz.gradientPurplePink,
      border: "1px solid transparent",
      color: color.neutral0,
    },
  }),
  deleteProductButton: css({
    border: `1px solid rgba(255, 107, 107, 0.35)`,
    background: "rgba(255, 107, 107, 0.06)",
    color: color.genz.coral,
    borderRadius: theme.br5,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    cursor: "pointer",
    transition: "all 0.18s ease",
    "&:hover": {
      background: "rgba(255, 107, 107, 0.15)",
      borderColor: "rgba(255, 107, 107, 0.6)",
    },
  }),
  emptyText: css({
    ...font.regular14,
    color: color.neutral500,
  }),
  primaryButton: css({
    border: "none",
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s5}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "filter 0.18s ease, transform 0.18s ease",
    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
    "&:hover": {
      filter: "brightness(1.1)",
      transform: "translateY(-1px)",
    },
  }),
  secondaryButton: css({
    border: `1.5px solid rgba(124, 58, 237, 0.3)`,
    background: "rgba(124, 58, 237, 0.05)",
    color: color.genz.purple,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.18s ease",
    "&:hover": {
      background: color.genz.gradientPurplePink,
      border: "1.5px solid transparent",
      color: color.neutral0,
      transform: "translateY(-1px)",
    },
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: `linear-gradient(-45deg, #0F0F1A, #1A1A2E, #2D1B69, #0F0F1A)`,
    backgroundSize: "400% 400%",
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "520px",
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid rgba(255,255,255,0.15)`,
    borderRadius: theme.s4,
    padding: theme.s6,
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    alignItems: "flex-start",
  }),
  gateTitle: css({
    ...font.boldH1_42,
    margin: 0,
    color: color.neutral0,
  }),
  gateText: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  }),
  modalBackdrop: css({
    position: "fixed",
    inset: 0,
    background: "rgba(15, 15, 26, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: theme.s4,
  }),
  confirmCard: css({
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(16px)",
    border: `1px solid rgba(124, 58, 237, 0.15)`,
    borderRadius: theme.s4,
    boxShadow: "0 24px 64px rgba(124, 58, 237, 0.2)",
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
