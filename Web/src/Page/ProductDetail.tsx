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
import { ProductCard } from "../View/Part/ProductCard"
import * as AuthToken from "../App/AuthToken"
import Link from "../View/Link"
import { toRoute } from "../Route"

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
    return <div className={styles.statusMsg}>Loading Product</div>
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

  const relatedProducts =
    state.product.listResponse._t === "Success"
      ? state.product.listResponse.data.items.filter(
          (item) =>
            item.sellerID.unwrap() === product.sellerID.unwrap() &&
            item.id.unwrap() !== product.id.unwrap(),
        )
      : []
  const productInList =
    state.product.listResponse._t === "Success"
      ? state.product.listResponse.data.items.find(
          (item) => item.id.unwrap() === product.id.unwrap(),
        )
      : undefined
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
                    <IoIosArrowBack size={24} />
                  </button>
                  <button
                    className={styles.navBtnRight}
                    onClick={() => changeIndex(currentIndex + 1)}
                  >
                    <IoIosArrowForward size={24} />
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
                    alt="thumb"
                    className={styles.thumbImg}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoWrapper}>
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
                aria-label={
                  isSaved ? "Remove from wishlist" : "Add to wishlist"
                }
                title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isSaved ? (
                  <IoIosHeart size={24} />
                ) : (
                  <IoIosHeartEmpty size={24} />
                )}
              </button>
            ) : null}

            <h1 className={styles.productName}>{product.name.unwrap()}</h1>
            <div className={styles.priceTag}>
              <span className={styles.coinBadge}>T</span>
              <span>
                {new Intl.NumberFormat("en-US", {
                  maximumFractionDigits: 0,
                }).format(shownPrice)}
              </span>
            </div>

            {orderedSizes.length > 0 ? (
              <div className={styles.variantSection}>
                <div className={styles.variantLabel}>
                  Choose your proper size
                </div>
                <div className={styles.variantList}>
                  {orderedSizes.map((size) => {
                    const variant = variantBySize.get(size)
                    if (variant == null) {
                      return null
                    }

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
                        onClick={() =>
                          emit(ProductAction.setSelectedVariantSize(size))
                        }
                        disabled={isOutOfStock}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <div className={styles.stockTag}>Stock: {shownStock}</div>

            <button
              className={styles.addToCartBtn}
              disabled={shownStock <= 0}
              onClick={() =>
                emit(
                  CartAction.addToCart({
                    id: product.id,
                    sellerID: product.sellerID,
                    name: product.name,
                    price: product.price,
                    url: product.urls[0],
                    categoryID: product.categoryID,
                    variants:
                      selectedVariant != null
                        ? [selectedVariant]
                        : product.variants,
                  }),
                )
              }
            >
              Add To Cart
            </button>

            <Link
              route={toRoute("SellerProfile", {
                id: product.sellerID.unwrap(),
              })}
              className={styles.sellerProfileLink}
            >
              <div className={styles.sellerProfileBlock}>
                <span className={styles.sellerProvidedBy}>Provided by:</span>
                <span className={styles.sellerAvatar}>{sellerInitial}</span>
                <span className={styles.sellerName}>{sellerShopName}</span>
              </div>
            </Link>
          </div>
        </div>

        <div className={styles.descriptionSection}>
          <div className={styles.descriptionTitle}>Product description:</div>
          <p className={styles.description}>{product.description.unwrap()}</p>
        </div>

        <div className={styles.otherSection}>
          <h2 className={styles.otherTitle}>Others Product of this shop</h2>
          {relatedProducts.length > 0 ? (
            <div className={styles.relatedGrid}>
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id.unwrap()}
                  product={related}
                  state={state}
                />
              ))}
            </div>
          ) : (
            <div className={styles.blankArea} />
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    padding: `${theme.s8} ${theme.s4}`,
    ...bp.xl({
      padding: `${theme.s10} ${theme.s0}`,
      maxWidth: "1200px",
      margin: "0 auto",
    }),
  }),
  pageContent: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  productGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s8,
    ...bp.lg({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  imageSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  mainImageContainer: css({
    position: "relative",
    width: "100%",
    paddingTop: "100%",
    backgroundColor: color.neutral50,
    borderRadius: theme.br2,
    overflow: "hidden",
  }),
  image: css({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  }),
  navBtnLeft: css({
    position: "absolute",
    left: theme.s2,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.8)",
    border: "none",
    borderRadius: "50%",
    padding: theme.s2,
    cursor: "pointer",
    display: "flex",
    zIndex: 2,
  }),
  navBtnRight: css({
    position: "absolute",
    right: theme.s2,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.8)",
    border: "none",
    borderRadius: "50%",
    padding: theme.s2,
    cursor: "pointer",
    display: "flex",
    zIndex: 2,
  }),
  thumbnailList: css({
    display: "flex",
    gap: theme.s2,
    overflowX: "auto",
  }),
  thumb: css({
    width: "80px",
    height: "80px",
    borderRadius: theme.br1,
    border: `2px solid ${color.secondary100}`,
    cursor: "pointer",
    overflow: "hidden",
    flexShrink: 0,
  }),
  thumbActive: css({
    width: "80px",
    height: "80px",
    borderRadius: theme.br1,
    border: `2px solid ${color.primary500}`,
    cursor: "pointer",
    overflow: "hidden",
    flexShrink: 0,
  }),
  thumbImg: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }),
  infoWrapper: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
    position: "relative",
    paddingRight: theme.s12,
  }),
  heartButton: css({
    position: "absolute",
    top: 0,
    right: 0,
    width: "42px",
    height: "42px",
    borderRadius: "10%",
    border: `1px solid ${color.secondary200}`,
    background: color.neutral0,
    color: color.secondary500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.elevation.medium,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.7,
      transform: "none",
    },
  }),
  heartButtonActive: css({
    color: color.semantics.error.red500,
    borderColor: color.semantics.error.red500,
    background: color.semantics.error.red50,
  }),
  productName: css({
    ...font.boldH1_42,
    fontSize: "32px",
    color: color.secondary500,
    lineHeight: 1.2,
  }),
  priceTag: css({
    ...font.bold17,
    color: color.primary500,
    fontSize: "24px",
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  coinBadge: css({
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: color.primary500,
    color: color.semantics.warning.yellow500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.bold17,
    fontSize: "18px",
    lineHeight: 1,
  }),
  description: css({
    ...font.regular17,
    color: color.neutral600,
    lineHeight: "1.6",
    margin: 0,
  }),
  descriptionTitle: css({
    ...font.bold14,
    color: color.secondary500,
    marginBottom: theme.s2,
  }),
  descriptionSection: css({
    marginTop: theme.s8,
    paddingTop: theme.s6,
    borderTop: `1px solid ${color.secondary100}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  stockTag: css({
    ...font.medium14,
    color: color.neutral700,
  }),
  variantSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  variantLabel: css({
    ...font.bold14,
    color: color.secondary500,
  }),
  variantList: css({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.s2,
  }),
  variantChip: css({
    minWidth: "48px",
    height: "34px",
    borderRadius: theme.br1,
    border: `1px solid ${color.secondary200}`,
    backgroundColor: color.neutral0,
    color: color.secondary500,
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.2s ease",
  }),
  variantChipSelected: css({
    borderColor: color.primary500,
    backgroundColor: color.secondary100,
    color: color.primary500,
  }),
  variantChipOut: css({
    borderColor: color.neutral300,
    backgroundColor: color.neutral200,
    color: color.neutral600,
    cursor: "not-allowed",
  }),
  addToCartBtn: css({
    padding: `${theme.s3} ${theme.s6}`,
    backgroundColor: color.primary500,
    color: color.neutral0,
    border: "none",
    borderRadius: theme.br2,
    cursor: "pointer",
    ...font.bold17,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: color.secondary500,
      transform: "translateY(-2px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
    "&:disabled": {
      backgroundColor: color.neutral300,
      color: color.neutral600,
      cursor: "not-allowed",
      transform: "none",
    },
  }),
  sellerProfileLink: css({
    textDecoration: "none",
    width: "100%",
  }),
  sellerProfileBlock: css({
    marginTop: theme.s3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.s2,
    width: "100%",
    textAlign: "center",
  }),
  sellerAvatar: css({
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.bold17,
    color: color.neutral0,
    backgroundColor: color.secondary500,
    border: `2px solid ${color.secondary200}`,
  }),
  sellerProvidedBy: css({
    ...font.regular12,
    color: color.neutral600,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    width: "100%",
    textAlign: "left",
  }),
  sellerName: css({
    ...font.medium14,
    color: color.secondary500,
    maxWidth: "100%",
    wordBreak: "break-word",
    textAlign: "center",
  }),
  otherSection: css({
    marginTop: theme.s10,
    paddingTop: theme.s6,
    borderTop: `1px solid ${color.secondary100}`,
  }),
  otherTitle: css({
    ...font.bold17,
    color: color.secondary500,
    marginBottom: theme.s4,
  }),
  relatedGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 220px))",
    justifyContent: "start",
    gap: theme.s4,
  }),
  blankArea: css({
    minHeight: "140px",
    borderRadius: theme.br2,
    backgroundColor: color.neutral50,
  }),
  statusMsg: css({
    padding: theme.s20,
    textAlign: "center",
    ...font.medium14,
    color: color.neutral500,
  }),
}
