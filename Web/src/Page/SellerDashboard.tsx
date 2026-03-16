import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as LoginAction from "../Action/Login"
import * as SellerDashboardAction from "../Action/SellerDashboard"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"

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

  const createState = state.sellerDashboard
  const seller =
    createState.profileResponse._t === "Success"
      ? createState.profileResponse.data.seller
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
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Seller Workspace</p>
          <h1 className={styles.title}>Seller Dashboard</h1>
          <p className={styles.subtitle}>
            Manage your catalog, monitor key numbers, and grow your store.
          </p>
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

          {createState.isEditingShop ? (
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
              value={createState.shopName}
              invalid={false}
              type="text"
              placeholder="Your shop name"
              disabled={!createState.isEditingShop}
              onChange={(v) => emit(SellerDashboardAction.onChangeShopName(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Shop Description</span>
            <InputText
              value={createState.shopDescription}
              invalid={false}
              type="text"
              placeholder="Tell customers what you sell"
              disabled={!createState.isEditingShop}
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
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Create New Product</h2>
        <p className={styles.panelDescription}>
          Quick create panel for your next product listing.
        </p>

        {createState.flashMessage != null ? (
          <div className={styles.flashCard}>
            <span>{createState.flashMessage}</span>
            <button
              className={styles.flashDismiss}
              onClick={() => emit(SellerDashboardAction.clearFlashMessage())}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <span className={styles.label}>Product Name</span>
            <InputText
              value={createState.name}
              invalid={false}
              type="text"
              placeholder="Product name"
              onChange={(v) => emit(SellerDashboardAction.onChangeName(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Price</span>
            <InputText
              value={createState.price}
              invalid={false}
              type="number"
              placeholder="100000"
              onChange={(v) => emit(SellerDashboardAction.onChangePrice(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>SKU</span>
            <InputText
              value={createState.sku}
              invalid={false}
              type="text"
              placeholder="SKU-001"
              onChange={(v) => emit(SellerDashboardAction.onChangeSku(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Stock</span>
            <InputText
              value={createState.stock}
              invalid={false}
              type="number"
              placeholder="10"
              onChange={(v) => emit(SellerDashboardAction.onChangeStock(v))}
            />
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Description</span>
            <InputText
              value={createState.description}
              invalid={false}
              type="text"
              placeholder="Product description"
              onChange={(v) =>
                emit(SellerDashboardAction.onChangeDescription(v))
              }
            />
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Image URL</span>
            <InputText
              value={createState.imageUrl}
              invalid={false}
              type="text"
              placeholder="https://..."
              onChange={(v) => emit(SellerDashboardAction.onChangeImageUrl(v))}
            />
          </div>
        </div>

        <div className={styles.actionsRow}>
          <Button
            theme_={"Red"}
            size={"M"}
            label={
              createState.createResponse._t === "Loading"
                ? "Creating..."
                : "Create Product"
            }
            onClick={() => emit(SellerDashboardAction.submitCreateProduct())}
            disabled={createState.createResponse._t === "Loading"}
          />
        </div>
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
                <article key={product.id.unwrap()} className={styles.productCard}>
                  <div className={styles.productName}>{product.name.unwrap()}</div>
                  <div className={styles.productMeta}>
                    Price: {formatCurrency(product.price.unwrap())}
                  </div>
                  <div className={styles.productMeta}>
                    SKU: {firstVariant?.sku.unwrap() ?? "-"}
                  </div>
                  <div className={styles.productMeta}>
                    Stock: {firstVariant?.stock.unwrap() ?? 0}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
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
  formGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  fieldFull: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    ...bp.md({
      gridColumn: "1 / span 2",
    }),
  }),
  label: css({
    ...font.regular14,
    color: color.neutral700,
  }),
  actionsRow: css({
    marginTop: theme.s4,
    display: "flex",
    justifyContent: "flex-end",
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
  emptyText: css({
    ...font.regular14,
    color: color.neutral700,
  }),
  flashCard: css({
    marginBottom: theme.s3,
    borderRadius: theme.s2,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary50,
    padding: `${theme.s2} ${theme.s3}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...font.medium14,
    color: color.neutral800,
  }),
  flashDismiss: css({
    border: "none",
    background: "none",
    textDecoration: "underline",
    color: color.secondary500,
    ...font.medium12,
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
}
