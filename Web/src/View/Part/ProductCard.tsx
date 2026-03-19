import { css } from "@emotion/css"
import { JSX } from "react"
import { BasicProduct } from "../../../../Core/App/ProductBasic"
import Link from "../Link"
import { navigateTo, toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { State } from "../../State"
import { emit } from "../../Runtime/React"
import * as ProductAction from "../../Action/Product"
import * as AuthToken from "../../App/AuthToken"
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io"

type Props = {
  product: BasicProduct
  state: State
}

export function ProductCard(props: Props): JSX.Element {
  const { product, state } = props
  const auth = AuthToken.get()
  const isUser = auth != null && auth.role === "USER"

  const getShopLabel = () => {
    const shopName = product.shopName?.unwrap()
    if (shopName != null && shopName.trim() !== "") {
      return shopName.length > 10 ? shopName.slice(0, 10) : shopName
    }

    const sellerId = product.sellerID.unwrap()
    return `Shop ${sellerId.slice(0, 8)}`
  }

  const getVariantSizes = () => {
    const variantRows = product.variants.map((variant) => {
      const fromName = variant.name.unwrap().split("-").pop()
      const sizeFromName = fromName != null ? fromName.trim().toUpperCase() : ""

      if (sizeFromName !== "") {
        return {
          size: sizeFromName,
          stock: variant.stock.unwrap(),
        }
      }

      const fromSku = variant.sku.unwrap().split("-").pop()
      const sizeFromSku = (fromSku ?? "").trim().toUpperCase()

      return {
        size: sizeFromSku,
        stock: variant.stock.unwrap(),
      }
    })

    const bySize = new Map<string, number>()
    variantRows.forEach((item) => {
      if (item.size === "") {
        return
      }

      const previous = bySize.get(item.size) ?? 0
      bySize.set(item.size, previous + item.stock)
    })

    const unique = Array.from(bySize.keys())
    const ordered = ["S", "M", "L", "XL"]
    const byKnownOrder = unique
      .filter((size) => ordered.includes(size))
      .sort((a, b) => ordered.indexOf(a) - ordered.indexOf(b))
    const custom = unique.filter((size) => ordered.includes(size) === false)

    return [...byKnownOrder, ...custom].map((size) => ({
      size,
      isOutOfStock: (bySize.get(size) ?? 0) <= 0,
    }))
  }

  const shopLabel = getShopLabel()
  const variantSizes = getVariantSizes()
  const isSaved = state.product.wishlistProductIDs.includes(product.id.unwrap())

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isUser) {
      return
    }

    emit(
      isSaved
        ? ProductAction.removeFromWishlist(product.id)
        : ProductAction.saveToWishlist(product.id),
    )
  }

  const openSellerProfile = () => {
    emit(
      navigateTo(toRoute("SellerProfile", { id: product.sellerID.unwrap() })),
    )
  }

  const handleOpenSellerProfile = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openSellerProfile()
  }

  return (
    <Link
      route={toRoute("ProductDetail", { id: product.id.unwrap() })}
      className={styles.card}
    >
      <>
        <div className={styles.imageContainer}>
          <button
            type="button"
            className={`${styles.wishlistButton} ${
              isSaved ? styles.wishlistButtonActive : ""
            }`}
            onClick={handleToggleWishlist}
            aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            disabled={!isUser || state.product.wishlistBusy}
          >
            {isSaved ? <IoIosHeart size={18} /> : <IoIosHeartEmpty size={18} />}
          </button>

          <img
            className={styles.image}
            src={product.url?.unwrap() || "https://via.placeholder.com/300"}
            alt={product.name.unwrap()}
            loading="lazy"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.metaContainer}>
            <span
              className={styles.shopItem}
              role="button"
              tabIndex={0}
              onClick={handleOpenSellerProfile}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  openSellerProfile()
                }
              }}
              title="View seller profile"
            >
              {shopLabel}
            </span>
            <div className={styles.price}>
              <span className={styles.coinBadge}>T</span>
              <span>{formatPrice(product.price.unwrap())}</span>
            </div>
          </div>

          <h3
            className={styles.name}
            title={product.name.unwrap()}
          >
            {product.name.unwrap()}
          </h3>

          {variantSizes.length > 0 ? (
            <div className={styles.variantRow}>
              {variantSizes.map((variantSize) => (
                <span
                  key={variantSize.size}
                  className={`${styles.variantItem} ${
                    variantSize.isOutOfStock ? styles.variantItemOut : ""
                  }`}
                >
                  {variantSize.size}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </>
    </Link>
  )
}

const nameClass = css({
  ...font.medium14,
  color: color.neutral900,
  marginBottom: theme.s1,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  height: "40px",
  transition: "color 0.2s",
})

const wishlistButtonClass = css({
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  color: color.secondary500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: `1px solid ${color.secondary200}`,
  position: "absolute",
  top: theme.s2,
  right: theme.s2,
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  zIndex: 3,
  "&:hover": {
    transform: "scale(1.1)",
    backgroundColor: color.neutral0,
  },
  "&:active": {
    transform: "scale(0.95)",
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.6,
    transform: "none",
  },
})

const styles = {
  card: css({
    display: "flex",
    flexDirection: "column",
    backgroundColor: color.neutral0,
    borderRadius: theme.br2,
    overflow: "hidden",
    border: `1px solid ${color.secondary100}`,
    textDecoration: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    height: "100%",
    position: "relative",
    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.08)",
      borderColor: color.primary200,
      [`& .${nameClass}`]: { color: color.primary500 },
    },
  }),
  name: nameClass,
  wishlistButton: wishlistButtonClass,
  wishlistButtonActive: css({
    backgroundColor: color.neutral0,
    color: color.semantics.error.red500,
    border: `1px solid ${color.semantics.error.red500}`,
  }),
  imageContainer: css({
    width: "100%",
    paddingTop: "100%",
    position: "relative",
    backgroundColor: color.neutral50,
    overflow: "hidden",
  }),
  image: css({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s ease",
    ".card:hover &": {
      transform: "scale(1.05)",
    },
  }),
  content: css({
    padding: theme.s4,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: theme.s2,
  }),
  metaContainer: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.s0,
  }),
  shopItem: css({
    padding: `${theme.s1} ${theme.s4}`,
    backgroundColor: color.secondary50,
    color: color.secondary500,
    borderRadius: theme.br1,
    ...font.medium12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: `1px solid transparent`,
    userSelect: "none",
    "&:hover": {
      backgroundColor: color.secondary100,
      borderColor: color.secondary200,
    },
    "&:focus": {
      outline: "none",
      borderColor: color.primary200,
    },
  }),
  variantRow: css({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.s1,
  }),
  variantItem: css({
    border: `1px solid ${color.secondary200}`,
    color: color.secondary500,
    background: color.neutral0,
    borderRadius: theme.br1,
    padding: `2px ${theme.s2}`,
    ...font.medium12,
  }),
  variantItemOut: css({
    background: color.neutral200,
    borderColor: color.neutral300,
    color: color.neutral600,
  }),
  price: css({
    ...font.bold17,
    color: color.primary500,
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s1,
  }),
  coinBadge: css({
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: color.primary500,
    color: color.semantics.warning.yellow500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.bold14,
    lineHeight: 1,
  }),
}
