import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as CartAction from "../Action/Cart"
import * as ProductAction from "../Action/Product"
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosHeart,
  IoIosHeartEmpty,
} from "react-icons/io"
import { IoStorefrontOutline } from "react-icons/io5"
import { ProductCard } from "../View/Part/ProductCard"
import { ProductRatingsSection } from "../View/Part/ProductRatingsSection"
import * as AuthToken from "../App/AuthToken"
import Link from "../View/Link"
import { toRoute } from "../Route"
import { createPrice } from "../../../Core/App/Product/Price"

export type ProductDetailPageProps = { state: AuthState | PublicState }

export default function ProductDetailPage(
  props: ProductDetailPageProps,
): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isUser = auth != null && auth.role === "USER"
  const detailRD = state.product.detailResponse
  const currentIndex = state.product.currentImageIndex
  const selectedSize = state.product.selectedVariantSize

  if (detailRD._t === "Loading") {
    return <div className={styles.statusMsg}>Loading Product...</div>
  }

  if (detailRD._t === "Failure") {
    return <div className={styles.statusMsg}>Cannot Find Product</div>
  }

  if (detailRD._t !== "Success") {
    return <></>
  }

  const product = detailRD.data
  const images = product.urls

  const variantRows = product.variants
    .map((variant) => {
      const fromName = variant.name.unwrap().split("-").pop()
      const parsedFromName =
        fromName != null ? fromName.trim().toUpperCase() : ""

      if (parsedFromName !== "") {
        return { size: parsedFromName, variant }
      }

      const fromSku = variant.sku.unwrap().split("-").pop()
      const parsedFromSku = (fromSku ?? "").trim().toUpperCase()

      return {
        size: parsedFromSku,
        variant,
      }
    })
    .filter((item) => item.size !== "")

  const variantBySize = new Map<
    string,
    (typeof variantRows)[number]["variant"]
  >()
  variantRows.forEach((item) => {
    if (!variantBySize.has(item.size)) {
      variantBySize.set(item.size, item.variant)
    }
  })

  const knownOrder = ["S", "M", "L", "XL"]
  const variantKeys = Array.from(variantBySize.keys())
  const knownSizes = variantKeys
    .filter((size) => knownOrder.includes(size))
    .sort((a, b) => knownOrder.indexOf(a) - knownOrder.indexOf(b))
  const customSizes = variantKeys.filter(
    (size) => knownOrder.includes(size) === false,
  )
  const orderedSizes = [...knownSizes, ...customSizes]

  const totalStock = product.variants.reduce(
    (acc, item) => acc + item.stock.unwrap(),
    0,
  )

  const selectedVariant =
    selectedSize != null ? (variantBySize.get(selectedSize) ?? null) : null

  const shownPrice =
    selectedVariant != null
      ? selectedVariant.price.unwrap()
      : product.price.unwrap()
  const shownStock =
    selectedVariant != null ? selectedVariant.stock.unwrap() : totalStock
  const maxSelectableQuantity = shownStock < 1 ? 1 : shownStock
  const selectedQuantity = Math.max(
    1,
    Math.min(state.product.selectedQuantity, maxSelectableQuantity),
  )
  const requiresVariantSelection = orderedSizes.length > 0
  const canAddToCart = shownStock > 0

  const relatedLimit = state.product.relatedListLimit
  const relatedPage = state.product.relatedListPage
  const allRelatedProducts = state.product.detailProductPool.filter(
    (item) =>
      item.sellerID.unwrap() === product.sellerID.unwrap() &&
      item.id.unwrap() !== product.id.unwrap(),
  )
  const relatedTotalCount = allRelatedProducts.length
  const relatedTotalPages = Math.max(
    1,
    Math.ceil(relatedTotalCount / relatedLimit),
  )
  const relatedStart = (relatedPage - 1) * relatedLimit
  const relatedProducts = allRelatedProducts.slice(
    relatedStart,
    relatedStart + relatedLimit,
  )
  const productInList = state.product.detailProductPool.find(
    (item) => item.id.unwrap() === product.id.unwrap(),
  )
  const sellerShopName =
    productInList?.shopName?.unwrap()?.trim() ||
    `Shop ${product.sellerID.unwrap().slice(0, 8)}`
  const sellerInitial = sellerShopName.charAt(0).toUpperCase()
  const isSaved = state.product.wishlistProductIDs.includes(product.id.unwrap())

  const changeIndex = (i: number) => {
    let nextIndex = i
    if (i < 0) nextIndex = images.length - 1
    if (i >= images.length) nextIndex = 0
    emit(ProductAction.setImageIndex(nextIndex))
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageContent}>
        <div className={styles.productGrid}>
          <div className={styles.imageSection}>
            <div className={styles.mainImageContainer}>
              <img
                src={images[currentIndex].unwrap()}
                alt={product.name.unwrap()}
                className={styles.image}
              />
              {images.length > 1 && (
                <>
                  <button
                    className={styles.navBtnLeft}
                    onClick={() => changeIndex(currentIndex - 1)}
                  >
                    <IoIosArrowBack size={20} />
                  </button>
                  <button
                    className={styles.navBtnRight}
                    onClick={() => changeIndex(currentIndex + 1)}
                  >
                    <IoIosArrowForward size={20} />
                  </button>
                </>
              )}
            </div>
            <div className={styles.thumbnailList}>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={
                    index === currentIndex ? styles.thumbActive : styles.thumb
                  }
                  onClick={() => emit(ProductAction.setImageIndex(index))}
                >
                  <img
                    src={img.unwrap()}
                    alt={`thumbnail ${index + 1}`}
                    className={styles.thumbImg}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoWrapper}>
            <div className={styles.titleRow}>
              <h1 className={styles.productName}>{product.name.unwrap()}</h1>
              {isUser ? (
                <button
                  className={`${styles.heartButton} ${isSaved ? styles.heartButtonActive : ""}`}
                  disabled={state.product.wishlistBusy}
                  onClick={() =>
                    emit(
                      isSaved
                        ? ProductAction.removeFromWishlist(product.id)
                        : ProductAction.saveToWishlist(product.id),
                    )
                  }
                  title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {isSaved ? (
                    <IoIosHeart size={28} />
                  ) : (
                    <IoIosHeartEmpty size={28} />
                  )}
                </button>
              ) : null}
            </div>

            <div className={styles.priceBox}>
              <div className={styles.priceTag}>
                <span className={styles.coinBadge}>T</span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 0,
                  }).format(shownPrice)}
                </span>
              </div>
            </div>

            {orderedSizes.length > 0 ? (
              <div className={styles.variantSection}>
                <div className={styles.sectionLabel}>
                  Size <span className={styles.requiredStar}>*</span>
                </div>
                <div className={styles.variantList}>
                  {orderedSizes.map((size) => {
                    const variant = variantBySize.get(size)
                    if (variant == null) return null

                    const stock = variant.stock.unwrap()
                    const isOutOfStock = stock <= 0
                    const isSelected = selectedSize === size

                    return (
                      <button
                        key={size}
                        type="button"
                        className={`${styles.variantChip} ${
                          isOutOfStock ? styles.variantChipOut : ""
                        } ${isSelected ? styles.variantChipSelected : ""}`}
                        onClick={() => {
                          emit(ProductAction.setSelectedVariantSize(size))
                          const cappedQuantity = Math.max(
                            1,
                            Math.min(state.product.selectedQuantity, stock),
                          )
                          emit(
                            ProductAction.setSelectedQuantity(cappedQuantity),
                          )
                        }}
                        disabled={isOutOfStock}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className={styles.quantitySection}>
              <div className={styles.sectionLabel}>
                Quantity{" "}
                <span className={styles.stockText}>
                  ({shownStock} available)
                </span>
              </div>
              <div className={styles.qtyControls}>
                <button
                  type="button"
                  className={styles.qtyButton}
                  disabled={canAddToCart === false || selectedQuantity <= 1}
                  onClick={() =>
                    emit(
                      ProductAction.setSelectedQuantity(selectedQuantity - 1),
                    )
                  }
                >
                  -
                </button>
                <input
                  className={styles.qtyInput}
                  type="number"
                  min={1}
                  max={shownStock}
                  value={selectedQuantity}
                  disabled={canAddToCart === false}
                  onChange={(e) => {
                    const parsed = Number(e.currentTarget.value)
                    if (Number.isFinite(parsed) === false) return
                    if (parsed > shownStock) {
                      emit(
                        ProductAction.showStockReminder(
                          `Maximum stock is ${shownStock} for this product.`,
                        ),
                      )
                    }
                    const nextQty = Math.max(
                      1,
                      Math.min(Math.floor(parsed), maxSelectableQuantity),
                    )
                    emit(ProductAction.setSelectedQuantity(nextQty))
                  }}
                />
                <button
                  type="button"
                  className={styles.qtyButton}
                  disabled={canAddToCart === false}
                  onClick={() => {
                    if (selectedQuantity >= shownStock) {
                      emit(
                        ProductAction.showStockReminder(
                          `Maximum stock reached for this product.`,
                        ),
                      )
                      return
                    }
                    emit(
                      ProductAction.setSelectedQuantity(selectedQuantity + 1),
                    )
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={styles.addToCartBtn}
              disabled={!canAddToCart}
              onClick={() => {
                if (canAddToCart === false) return
                if (requiresVariantSelection && selectedVariant == null) {
                  emit(ProductAction.showVariantReminder())
                  return
                }
                if (selectedQuantity > shownStock) {
                  emit(
                    ProductAction.showStockReminder(
                      `Maximum stock is ${shownStock} for this product.`,
                    ),
                  )
                  return
                }
                emit(ProductAction.clearVariantReminder())
                emit(ProductAction.clearStockReminder())

                emit(
                  CartAction.addToCart(
                    {
                      id: product.id,
                      sellerID: product.sellerID,
                      name: product.name,
                      price:
                        selectedVariant != null
                          ? (createPrice(selectedVariant.price.unwrap()) ??
                            product.price)
                          : product.price,
                      url: product.urls[0],
                      categoryID: product.categoryID,
                      variants:
                        selectedVariant != null
                          ? [selectedVariant]
                          : product.variants,
                    },
                    selectedQuantity,
                  ),
                )
                emit(ProductAction.setSelectedQuantity(1))
              }}
            >
              Add To Cart
            </button>

            <Link
              route={toRoute("SellerProfile", {
                id: product.sellerID.unwrap(),
              })}
              className={styles.sellerProfileLink}
            >
              <div className={styles.sellerProfileCard}>
                <div className={styles.sellerAvatar}>{sellerInitial}</div>
                <div className={styles.sellerInfo}>
                  <span className={styles.sellerProvidedBy}>Sold by</span>
                  <span className={styles.sellerName}>{sellerShopName}</span>
                </div>
                <IoStorefrontOutline
                  size={24}
                  className={styles.sellerIcon}
                />
              </div>
            </Link>
          </div>
        </div>

        <div className={styles.descriptionSection}>
          <div className={styles.sectionLabel}>Product Description</div>
          <p className={styles.description}>{product.description.unwrap()}</p>
        </div>

        <ProductRatingsSection
          ratingsResponse={state.product.ratingsResponse}
        />

        <div className={styles.otherSection}>
          <div className={styles.otherHeader}>
            <h2 className={styles.otherTitle}>More from this shop</h2>
            {relatedTotalCount > 0 && (
              <div className={styles.relatedPaginationInfo}>
                Showing {relatedStart + 1}–
                {Math.min(relatedStart + relatedLimit, relatedTotalCount)} of{" "}
                {relatedTotalCount}
              </div>
            )}
          </div>
          {relatedProducts.length > 0 ? (
            <>
              <div className={styles.relatedGrid}>
                {relatedProducts.map((related) => (
                  <ProductCard
                    key={related.id.unwrap()}
                    product={related}
                    state={state}
                  />
                ))}
              </div>
              {relatedTotalPages > 1 && (
                <div className={styles.relatedPaginationControls}>
                  <button
                    className={styles.relatedPaginationButton}
                    onClick={() =>
                      emit(ProductAction.changeRelatedListPage(relatedPage - 1))
                    }
                    disabled={relatedPage === 1}
                  >
                    ← Previous
                  </button>
                  <div className={styles.relatedPageNumbers}>
                    {Array.from(
                      { length: relatedTotalPages },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <button
                        key={p}
                        className={`${styles.relatedPageButton} ${p === relatedPage ? styles.relatedPageButtonActive : ""}`}
                        onClick={() =>
                          emit(ProductAction.changeRelatedListPage(p))
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    className={styles.relatedPaginationButton}
                    onClick={() =>
                      emit(ProductAction.changeRelatedListPage(relatedPage + 1))
                    }
                    disabled={relatedPage === relatedTotalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.blankArea}>
              <p>No other products available.</p>
            </div>
          )}
        </div>
      </div>

      {state.product.variantReminderVisible ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalTitle}>Choose a size</div>
            <div className={styles.modalBody}>
              Please select a size before adding this product to your cart.
            </div>
            <button
              type="button"
              className={styles.modalBtnOutline}
              onClick={() => emit(ProductAction.clearVariantReminder())}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {state.product.stockReminderMessage != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Notice</h3>
            <p className={styles.modalBody}>
              {state.product.stockReminderMessage}
            </p>
            <button
              className={styles.modalBtn}
              onClick={() => emit(ProductAction.clearStockReminder())}
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    padding: `${theme.s6} ${theme.s4}`,
    background:
      "linear-gradient(160deg, rgba(0, 82, 156, 0.04) 0%, rgba(255, 255, 255, 1) 35%, rgba(237, 28, 36, 0.02) 100%)",
    ...bp.lg({
      padding: `${theme.s10} ${theme.s0}`,
      margin: "0 auto",
    }),
  }),
  pageContent: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s10,
    color: color.neutral800,
    padding: theme.br5,
  }),
  productGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s8,
    alignItems: "start",
    ...bp.lg({
      gridTemplateColumns: "minmax(320px, 460px) 1fr",
      gap: theme.s12,
    }),
  }),
  imageSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
    position: "sticky",
    top: "24px",
    zIndex: 10,
  }),
  mainImageContainer: css({
    position: "relative",
    width: "100%",
    maxHeight: "500px",
    aspectRatio: "1/1",
    backgroundColor: color.neutral10,
    borderRadius: theme.br3,
    border: "2px solid var(--app-border)",
    overflow: "hidden",
    boxShadow: theme.elevation.medium,
  }),
  image: css({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  }),
  navBtnLeft: css({
    position: "absolute",
    left: theme.s3,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.9)",
    border: `1px solid ${color.neutral100}`,
    color: color.neutral700,
    boxShadow: theme.elevation.small,
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 0.2s ease, color 0.2s ease, background 0.2s ease",
    "&:hover": {
      color: "var(--app-accent)",
      transform: "translateY(-50%) scale(1.05)",
      background: color.neutral0,
    },
    "&:focus-visible": {
      outline: "2px solid var(--app-accent)",
      outlineOffset: "2px",
    },
  }),
  navBtnRight: css({
    position: "absolute",
    right: theme.s3,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.9)",
    border: `1px solid ${color.neutral100}`,
    color: color.neutral700,
    boxShadow: theme.elevation.small,
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 0.2s ease, color 0.2s ease, background 0.2s ease",
    "&:hover": {
      color: "var(--app-accent)",
      transform: "translateY(-50%) scale(1.05)",
      background: color.neutral0,
    },
    "&:focus-visible": {
      outline: "2px solid var(--app-accent)",
      outlineOffset: "2px",
    },
  }),
  thumbnailList: css({
    display: "flex",
    gap: theme.s3,
    overflowX: "auto",
    paddingBottom: theme.s2,
    scrollbarWidth: "thin",
    scrollbarColor: `${color.neutral200} transparent`,
    "&::-webkit-scrollbar": { height: "4px" },
    "&::-webkit-scrollbar-track": { background: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: color.neutral200,
      borderRadius: "4px",
    },
  }),
  thumb: css({
    flexShrink: 0,
    width: "72px",
    height: "72px",
    borderRadius: theme.br2,
    border: `2px solid transparent`,
    backgroundColor: color.neutral10,
    overflow: "hidden",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
    "&:hover": { opacity: 0.8 },
    "&:focus-visible": {
      outline: "2px solid var(--app-accent)",
    },
  }),
  thumbActive: css({
    flexShrink: 0,
    width: "72px",
    height: "72px",
    borderRadius: theme.br2,
    border: "2px solid var(--app-accent)",
    backgroundColor: color.neutral10,
    overflow: "hidden",
    cursor: "default",
    boxShadow: "0 0 0 3px rgba(0, 82, 156, 0.16)",
  }),
  thumbImg: css({
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none",
  }),
  infoWrapper: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s6,
  }),
  titleRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
  }),
  productName: css({
    ...font.boldH3_29,
    margin: 0,
    lineHeight: 1.3,
    wordBreak: "break-word",
    color: "var(--app-accent)",
  }),
  heartButton: css({
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: `1px solid ${color.neutral200}`,
    background: color.neutral0,
    color: color.neutral400,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: color.semantics.error.red500,
      color: color.semantics.error.red500,
      background: color.semantics.error.red50,
    },
    "&:focus-visible": {
      outline: `2px solid ${color.semantics.error.red500}`,
      outlineOffset: "2px",
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
      pointerEvents: "none",
    },
  }),
  heartButtonActive: css({
    color: color.semantics.error.red500,
    borderColor: color.semantics.error.red500,
    background: color.semantics.error.red50,
  }),
  priceBox: css({
    padding: `${theme.s4} ${theme.s5}`,
    background:
      "linear-gradient(135deg, rgba(0, 82, 156, 0.08) 0%, rgba(237, 28, 36, 0.06) 100%)",
    borderRadius: theme.br2,
    border: "1px solid var(--app-border)",
    borderLeft: `4px solid ${color.secondary500}`,
    boxShadow: theme.elevation.xsmall,
  }),
  priceTag: css({
    ...font.boldH2_35,
    color: color.secondary500,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
  }),
  coinBadge: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    color: color.neutral0,
    boxShadow: "0 2px 8px rgba(255, 165, 0, 0.4)",
    ...font.boldH4_24,
    userSelect: "none",
  }),
  sectionLabel: css({
    ...font.bold14,
    marginBottom: theme.s3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--app-accent)",
  }),
  requiredStar: css({
    color: color.semantics.error.red500,
  }),
  stockText: css({
    ...font.regular13,
    color: color.neutral500,
    marginLeft: theme.s1,
    textTransform: "none",
    letterSpacing: "0",
  }),
  variantSection: css({
    display: "flex",
    flexDirection: "column",
  }),
  variantList: css({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.s3,
  }),
  variantChip: css({
    height: "40px",
    padding: `0 ${theme.s5}`,
    borderRadius: "100px",
    border: `1px solid ${color.neutral300}`,
    backgroundColor: color.neutral0,
    color: color.neutral700,
    cursor: "pointer",
    ...font.medium14,
    transition: "all 0.2s ease",
    "&:hover:not(:disabled)": {
      borderColor: "var(--app-brand-400)",
      color: "var(--app-accent)",
    },
    "&:focus-visible": {
      outline: "2px solid var(--app-accent)",
      outlineOffset: "2px",
    },
  }),
  variantChipSelected: css({
    borderColor: "transparent",
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    color: color.neutral0,
    boxShadow: theme.elevation.small,
    "&:hover:not(:disabled)": {
      borderColor: "transparent",
      color: color.neutral0,
      transform: "translateY(-1px)",
    },
  }),
  variantChipOut: css({
    backgroundColor: color.neutral50,
    color: color.neutral400,
    textDecoration: "line-through",
    cursor: "not-allowed",
    opacity: 0.6,
  }),
  quantitySection: css({
    display: "flex",
    flexDirection: "column",
  }),
  qtyControls: css({
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    border: `1px solid ${color.neutral300}`,
    borderRadius: theme.br2,
    overflow: "hidden",
  }),
  qtyButton: css({
    width: "44px",
    height: "44px",
    border: "none",
    background: color.neutral10,
    color: color.secondary500,
    cursor: "pointer",
    ...font.regularH4_24,
    lineHeight: 1,
    userSelect: "none",
    fontWeight: 700,
    transition: "background-color 0.2s ease, color 0.2s ease",
    "&:hover:not(:disabled)": {
      backgroundColor: "var(--app-brand-20)",
    },
    "&:active:not(:disabled)": {
      backgroundColor: "var(--app-border)",
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
  }),
  qtyInput: css({
    width: "56px",
    height: "44px",
    textAlign: "center",
    border: "none",
    borderLeft: `1px solid ${color.neutral300}`,
    borderRight: `1px solid ${color.neutral300}`,
    color: color.neutral900,
    ...font.medium17,
    "&:focus": {
      outline: "none",
      backgroundColor: color.primary10,
    },
    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
  }),
  addToCartBtn: css({
    width: "100%",
    marginTop: theme.s2,
    padding: theme.s4,
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    color: color.neutral0,
    border: "none",
    borderRadius: theme.br2,
    boxShadow: theme.elevation.medium,
    cursor: "pointer",
    ...font.bold17,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover:not(:disabled)": {
      transform: "translateY(-2px)",
      boxShadow: theme.elevation.large,
    },
    "&:active:not(:disabled)": {
      transform: "translateY(0)",
      boxShadow: theme.elevation.small,
    },
    "&:focus-visible": {
      outline: "2px solid var(--app-accent)",
      outlineOffset: "4px",
    },
    "&:disabled": {
      background: color.neutral300,
      color: color.neutral100,
      boxShadow: "none",
      cursor: "not-allowed",
    },
  }),
  sellerProfileLink: css({
    display: "block",
    width: "100%",
    marginTop: theme.s4,
    textDecoration: "none",
  }),
  sellerProfileCard: css({
    display: "flex",
    alignItems: "center",
    padding: theme.s4,
    backgroundColor: color.neutral0,
    border: "1px solid var(--app-border)",
    borderRadius: theme.br2,
    transition: "all 0.2s ease",
    "&:hover": {
      background:
        "linear-gradient(135deg, rgba(0, 82, 156, 0.05) 0%, rgba(237, 28, 36, 0.04) 100%)",
      borderColor: "var(--app-border-strong)",
      boxShadow: theme.elevation.small,
      transform: "translateY(-1px)",
    },
  }),
  sellerAvatar: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    marginRight: theme.s3,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    color: color.neutral0,
    ...font.boldH4_24,
    boxShadow: theme.elevation.small,
  }),
  sellerInfo: css({
    display: "flex",
    flexDirection: "column",
    flex: 1,
  }),
  sellerProvidedBy: css({
    ...font.regular12,
    color: color.neutral500,
  }),
  sellerName: css({
    ...font.medium14,
    color: color.neutral900,
  }),
  sellerIcon: css({
    color: color.neutral300,
  }),
  descriptionSection: css({
    paddingTop: theme.s8,
    borderTop: "2px solid var(--app-border)",
  }),
  description: css({
    margin: 0,
    color: color.neutral700,
    whiteSpace: "pre-wrap",
    ...font.regular14,
  }),
  otherSection: css({
    paddingTop: theme.s8,
    borderTop: "2px solid var(--app-border)",
  }),
  otherHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s6,
  }),
  otherTitle: css({
    margin: 0,
    ...font.boldH4_24,
    color: "var(--app-accent)",
  }),
  relatedPaginationInfo: css({
    ...font.regular12,
    color: "var(--app-accent)",
    whiteSpace: "nowrap",
    fontWeight: 600,
  }),
  relatedPaginationControls: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s2,
    marginTop: theme.s6,
    paddingTop: theme.s4,
    borderTop: "1px solid var(--app-border)",
  }),
  relatedPaginationButton: css({
    padding: `${theme.s2} ${theme.s5}`,
    border: "1px solid var(--app-border)",
    borderRadius: "20px",
    backgroundColor: color.neutral0,
    color: "var(--app-accent)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover:not(:disabled)": {
      background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
      color: color.neutral0,
      borderColor: "transparent",
      transform: "translateY(-1px)",
      boxShadow: theme.elevation.small,
    },
    "&:disabled": {
      borderColor: color.neutral200,
      color: color.neutral300,
      cursor: "not-allowed",
      opacity: 0.5,
    },
  }),
  relatedPageNumbers: css({
    display: "flex",
    gap: theme.s1,
  }),
  relatedPageButton: css({
    width: "34px",
    height: "34px",
    border: "1px solid var(--app-border)",
    borderRadius: "50%",
    backgroundColor: color.neutral0,
    color: "var(--app-accent)",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "var(--app-brand-400)",
      background: "var(--app-brand-20)",
      transform: "scale(1.1)",
    },
  }),
  relatedPageButtonActive: css({
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    borderColor: "transparent",
    color: color.neutral0,
    boxShadow: theme.elevation.small,
    "&:hover": {
      background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
      borderColor: "transparent",
      color: color.neutral0,
      transform: "scale(1.1)",
    },
  }),
  relatedGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: theme.s4,
    ...bp.md({ gridTemplateColumns: "repeat(4, 1fr)" }),
    ...bp.lg({ gridTemplateColumns: "repeat(8, 1fr)" }),
  }),
  blankArea: css({
    padding: theme.s10,
    textAlign: "center",
    background:
      "linear-gradient(135deg, rgba(0, 82, 156, 0.05) 0%, rgba(237, 28, 36, 0.03) 100%)",
    borderRadius: theme.br2,
    border: "1px dashed var(--app-border)",
    color: color.neutral500,
    ...font.medium14,
  }),
  statusMsg: css({
    padding: "120px 20px",
    textAlign: "center",
    ...font.medium17,
    color: "var(--app-accent)",
  }),
  modalOverlay: css({
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s4,
    background: "rgba(15, 15, 26, 0.6)",
    backdropFilter: "blur(4px)",
  }),
  modalCard: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
    width: "100%",
    maxWidth: "400px",
    padding: theme.s6,
    textAlign: "center",
    background: color.neutral0,
    borderRadius: theme.br3,
    boxShadow: theme.elevation.medium,
  }),
  modalTitle: css({
    margin: 0,
    color: color.neutral900,
    ...font.bold17,
  }),
  modalBody: css({
    margin: 0,
    color: color.neutral600,
    ...font.regular14,
  }),
  modalBtn: css({
    width: "100%",
    padding: theme.s3,
    border: "none",
    borderRadius: theme.br2,
    background: color.genz.purple,
    color: color.neutral0,
    cursor: "pointer",
    ...font.bold14,
    transition: "background-color 0.2s ease",
    "&:hover": {
      background: color.tertiary.violet500,
    },
    "&:focus-visible": {
      outline: `2px solid ${color.neutral900}`,
      outlineOffset: "2px",
    },
  }),
  modalBtnOutline: css({
    width: "100%",
    padding: theme.s3,
    border: `1px solid ${color.neutral300}`,
    borderRadius: theme.br2,
    background: color.neutral0,
    color: color.neutral800,
    cursor: "pointer",
    ...font.bold14,
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    "&:hover": {
      background: color.neutral50,
      borderColor: color.neutral400,
    },
    "&:focus-visible": {
      outline: `2px solid ${color.genz.purple}`,
      outlineOffset: "2px",
    },
  }),
}
