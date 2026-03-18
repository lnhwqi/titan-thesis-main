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
import {
  createNameE as createProductNameE,
  ErrorName as ErrorProductName,
} from "../../../Core/App/Product/Name"
import { createPriceE, ErrorPrice } from "../../../Core/App/Product/Price"
import {
  createDescriptionE,
  ErrorDescription,
} from "../../../Core/App/Product/Description"
import {
  createSKUE,
  ErrorSKU,
} from "../../../Core/App/ProductVariant/ProductVarirantSKU"
import { createStockE } from "../../../Core/App/ProductVariant/Stock"
import { Category } from "../../../Core/App/Category"

const imageInputElementId = "seller-dashboard-image-input"
type VariantSize = "S" | "M" | "L" | "XL"
const variantSizeOrder: VariantSize[] = ["S", "M", "L", "XL"]

export type Props = { state: State }

export default function SellerDashboardPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"
  const openImagePicker = () => {
    if (typeof document === "undefined") {
      return
    }
    const node = document.getElementById(imageInputElementId)
    if (node instanceof HTMLInputElement) {
      node.click()
    }
  }

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
  const categoryOptions =
    state.category.treeResponse._t === "Success"
      ? toCategoryOptions(state.category.treeResponse.data)
      : []
  const categoryOptionIDs = new Set(categoryOptions.map((item) => item.id))
  const isCategoryLoading =
    state.category.treeResponse._t === "NotAsked" ||
    state.category.treeResponse._t === "Loading"
  const hasCategories = categoryOptions.length > 0
  const createErrors = getCreateProductErrors(createState, categoryOptionIDs)
  const showCreateError = (
    field: keyof State["sellerDashboard"]["createTouched"],
  ) => createState.createTouched[field] && createErrors[field] != null
  const isCreateDisabled =
    createState.createResponse._t === "Loading" ||
    createState.isUploadingImages ||
    Object.values(createErrors).some((msg) => msg != null)
  const seller =
    createState.profileResponse._t === "Success"
      ? createState.profileResponse.data.seller
      : null

  const remainingImageSlots =
    SellerDashboardAction.MAX_PRODUCT_IMAGES - createState.imageUrls.length
  const uploadDisabled =
    createState.isUploadingImages || remainingImageSlots <= 0

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
              invalid={showCreateError("name")}
              type="text"
              placeholder="Product name"
              onChange={(v) => emit(SellerDashboardAction.onChangeName(v))}
            />
            {showCreateError("name") ? (
              <span className={styles.fieldError}>{createErrors.name}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <select
              className={`${styles.selectInput} ${
                showCreateError("categoryID") ? styles.selectInputInvalid : ""
              }`}
              value={createState.categoryID}
              disabled={isCategoryLoading || !hasCategories}
              onChange={(event) =>
                emit(
                  SellerDashboardAction.onChangeCategoryID(
                    event.currentTarget.value,
                  ),
                )
              }
            >
              <option value="">
                {isCategoryLoading
                  ? "Loading categories..."
                  : hasCategories
                    ? "Select a lowest-level child category"
                    : "No categories available"}
              </option>
              {categoryOptions.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.label}
                </option>
              ))}
            </select>
            {!isCategoryLoading && !hasCategories ? (
              <span className={styles.fieldHint}>
                Ask admin to create categories before listing products.
              </span>
            ) : null}
            {!isCategoryLoading && hasCategories ? (
              <span className={styles.fieldHint}>
                Choose the lowest-level child category that best matches this
                product. Options are shown as Root - Parent - Leaf.
              </span>
            ) : null}
            {showCreateError("categoryID") ? (
              <span className={styles.fieldError}>
                {createErrors.categoryID}
              </span>
            ) : null}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Price</span>
            <InputText
              value={createState.price}
              invalid={showCreateError("price")}
              type="number"
              placeholder="100000"
              onChange={(v) => emit(SellerDashboardAction.onChangePrice(v))}
            />
            {showCreateError("price") ? (
              <span className={styles.fieldError}>{createErrors.price}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>SKU</span>
            <InputText
              value={createState.sku}
              invalid={showCreateError("sku")}
              type="text"
              placeholder="SKU-001"
              onChange={(v) => emit(SellerDashboardAction.onChangeSku(v))}
            />
            {showCreateError("sku") ? (
              <span className={styles.fieldError}>{createErrors.sku}</span>
            ) : null}
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Variant Stocks (S/M/L/XL)</span>
            <div className={styles.variantGrid}>
              {variantSizeOrder.map((size) => (
                <div
                  key={size}
                  className={styles.variantCard}
                >
                  <span className={styles.variantLabel}>Size {size}</span>
                  <InputText
                    value={createState.variantStocks[size]}
                    invalid={showCreateError("stock")}
                    type="number"
                    placeholder="0"
                    onChange={(v) =>
                      emit(SellerDashboardAction.onChangeVariantStock(size, v))
                    }
                  />
                </div>
              ))}
            </div>
            <span className={styles.fieldHint}>
              Each variant uses base SKU + size suffix and base product price.
            </span>
            {showCreateError("stock") ? (
              <span className={styles.fieldError}>{createErrors.stock}</span>
            ) : null}
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Description</span>
            <InputText
              value={createState.description}
              invalid={showCreateError("description")}
              type="text"
              placeholder="Product description"
              onChange={(v) =>
                emit(SellerDashboardAction.onChangeDescription(v))
              }
            />
            {showCreateError("description") ? (
              <span className={styles.fieldError}>
                {createErrors.description}
              </span>
            ) : null}
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Product Images</span>
            <input
              id={imageInputElementId}
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenFileInput}
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? [])
                if (files.length > 0) {
                  emit(SellerDashboardAction.uploadProductImages(files))
                }
                event.currentTarget.value = ""
              }}
            />
            <div className={styles.imageUploadRow}>
              <button
                className={styles.uploadButton}
                type="button"
                onClick={() => {
                  if (!uploadDisabled) {
                    openImagePicker()
                  }
                }}
                disabled={uploadDisabled}
              >
                {createState.isUploadingImages
                  ? "Uploading..."
                  : "Select images"}
              </button>
              <span className={styles.imageHint}>
                {createState.imageUrls.length}/
                {SellerDashboardAction.MAX_PRODUCT_IMAGES} uploaded | Up to{" "}
                {SellerDashboardAction.MAX_UPLOAD_SIZE_MB} MB each
              </span>
            </div>
            {createState.imageUrls.length > 0 ? (
              <div className={styles.imagePreviewGrid}>
                {createState.imageUrls.map((url) => (
                  <div
                    key={url}
                    className={styles.imagePreviewCard}
                  >
                    <img
                      src={url}
                      alt="Product visual"
                      className={styles.imagePreview}
                      loading="lazy"
                    />
                    <button
                      type="button"
                      className={styles.imageRemoveButton}
                      onClick={() =>
                        emit(SellerDashboardAction.removeImageUrl(url))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyImagesText}>
                No images uploaded yet.
              </div>
            )}
            {showCreateError("imageUrls") ? (
              <span className={styles.fieldError}>
                {createErrors.imageUrls}
              </span>
            ) : null}
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
            disabled={isCreateDisabled}
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

type CreateErrors = Record<
  keyof State["sellerDashboard"]["createTouched"],
  string | null
>

function getCreateProductErrors(
  sellerState: State["sellerDashboard"],
  categoryOptionIDs: Set<string>,
): CreateErrors {
  const trimmedName = sellerState.name.trim()
  const trimmedDescription = sellerState.description.trim()
  const trimmedSku = sellerState.sku.trim()
  const priceValue = Number(sellerState.price)
  const invalidSizes = variantSizeOrder.filter((size) => {
    const value = sellerState.variantStocks[size]
    if (value.trim() === "") {
      return false
    }

    const parsed = Number(value)
    if (Number.isFinite(parsed) === false) {
      return true
    }

    return createStockE(parsed)._t === "Err"
  })

  return {
    name:
      trimmedName === ""
        ? "Product name is required."
        : mapProductNameError(createProductNameE(trimmedName)),
    categoryID:
      sellerState.categoryID.trim() === ""
        ? "Please select a lowest-level child category."
        : categoryOptionIDs.has(sellerState.categoryID.trim()) === false
          ? "Only lowest-level child categories can be selected."
          : null,
    price:
      sellerState.price.trim() === ""
        ? "Price is required."
        : Number.isFinite(priceValue) === false
          ? "Enter a valid number for price."
          : mapPriceError(createPriceE(priceValue)),
    description:
      trimmedDescription === ""
        ? "Description is required."
        : mapDescriptionError(createDescriptionE(trimmedDescription)),
    imageUrls:
      sellerState.imageUrls.length === 0
        ? "Upload at least one product image."
        : null,
    sku:
      trimmedSku === ""
        ? "SKU is required."
        : mapSkuError(createSKUE(trimmedSku)),
    stock:
      invalidSizes.length > 0
        ? `Invalid stock for size: ${invalidSizes.join(", ")}. Use whole numbers between 0 and 1,000,000.`
        : null,
  }
}

function mapProductNameError(
  result: ReturnType<typeof createProductNameE>,
): string | null {
  if (result._t === "Ok") return null
  return productNameErrorMessage(result.error)
}

function mapPriceError(result: ReturnType<typeof createPriceE>): string | null {
  return result._t === "Err" ? priceErrorMessage(result.error) : null
}

function mapDescriptionError(
  result: ReturnType<typeof createDescriptionE>,
): string | null {
  return result._t === "Err" ? descriptionErrorMessage(result.error) : null
}

function mapSkuError(result: ReturnType<typeof createSKUE>): string | null {
  return result._t === "Err" ? skuErrorMessage(result.error) : null
}

function productNameErrorMessage(_error: ErrorProductName): string {
  return "Product name must be between 1 and 100 characters."
}

function priceErrorMessage(_error: ErrorPrice): string {
  return "Price must be a positive whole number."
}

function descriptionErrorMessage(_error: ErrorDescription): string {
  return "Description must be 1-1024 characters."
}

function skuErrorMessage(_error: ErrorSKU): string {
  return "SKU must be 1-100 characters with no spaces."
}

type CategoryOption = {
  id: string
  label: string
}

function toCategoryOptions(
  categories: Category[],
  parents: string[] = [],
): CategoryOption[] {
  return categories.flatMap((item) => {
    const path = [...parents, item.name.unwrap()]

    if (item.children.length === 0) {
      return [{ id: item.id.unwrap(), label: path.join(" - ") }]
    }

    return toCategoryOptions(item.children, path)
  })
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
  fieldError: css({
    ...font.regular12,
    color: color.semantics.error.red500,
  }),
  fieldHint: css({
    ...font.regular12,
    color: color.neutral600,
  }),
  variantGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.s2,
    ...bp.md({
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    }),
  }),
  variantCard: css({
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    background: color.neutral50,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  variantLabel: css({
    ...font.medium12,
    color: color.secondary500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
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
  selectInput: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.neutral900,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  selectInputInvalid: css({
    borderColor: color.semantics.error.red500,
  }),
  hiddenFileInput: css({
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    border: 0,
    clip: "rect(0 0 0 0)",
  }),
  imageUploadRow: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  uploadButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "opacity 120ms ease",
    ":disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  }),
  imageHint: css({
    ...font.regular12,
    color: color.neutral600,
  }),
  imagePreviewGrid: css({
    marginTop: theme.s2,
    display: "grid",
    gap: theme.s2,
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  }),
  imagePreviewCard: css({
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    overflow: "hidden",
    background: color.neutral0,
    display: "flex",
    flexDirection: "column",
  }),
  imagePreview: css({
    width: "100%",
    height: "140px",
    objectFit: "cover",
    background: color.neutral100,
  }),
  imageRemoveButton: css({
    border: "none",
    background: "transparent",
    color: color.semantics.error.red500,
    ...font.medium12,
    cursor: "pointer",
    padding: `${theme.s1} ${theme.s2}`,
    textAlign: "left",
  }),
  emptyImagesText: css({
    marginTop: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    borderRadius: theme.s2,
    border: `1px dashed ${color.secondary200}`,
    ...font.regular12,
    color: color.neutral600,
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
