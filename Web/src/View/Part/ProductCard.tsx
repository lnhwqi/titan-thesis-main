import { css } from "@emotion/css"
import { JSX } from "react"
import { BasicProduct } from "../../../../Core/App/ProductBasic"
import Link from "../Link"
import { navigateTo, toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { State } from "../../State"
import { emit } from "../../Runtime/React"
import { cmd, perform } from "../../Action"
import * as ProductAction from "../../Action/Product"
import * as AuthToken from "../../App/AuthToken"
import { _RegisterState } from "../../State/Register"
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io"
import { fadeSlideUp } from "../Theme/Keyframe"

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
      return shopName.length > 20 ? shopName.slice(0, 20) : shopName
    }
    return `Partner`
  }

  const getVariantSizes = () => {
    const variantRows = product.variants.map((variant) => {
      const fromName = variant.name.unwrap().split("-").at(-1)
      const sizeFromName = fromName != null ? fromName.trim().toUpperCase() : ""

      if (sizeFromName !== "") {
        return {
          size: sizeFromName,
          stock: variant.stock.unwrap(),
        }
      }

      const fromSku = variant.sku.unwrap().split("-").at(-1)
      const sizeFromSku = (fromSku ?? "").trim().toUpperCase()

      return {
        size: sizeFromSku,
        stock: variant.stock.unwrap(),
      }
    })

    const bySize = variantRows.reduce<Record<string, number>>((acc, item) => {
      if (item.size === "") {
        return acc
      }

      return {
        ...acc,
        [item.size]: (acc[item.size] ?? 0) + item.stock,
      }
    }, {})

    const unique = Object.keys(bySize)
    const ordered = ["S", "M", "L", "XL"]
    const byKnownOrder = unique
      .filter((size) => ordered.includes(size))
      .toSorted((a, b) => ordered.indexOf(a) - ordered.indexOf(b))
    const custom = unique.filter((size) => ordered.includes(size) === false)

    return [...byKnownOrder, ...custom].map((size) => ({
      size,
      isOutOfStock: (bySize[size] ?? 0) <= 0,
    }))
  }

  const shopLabel = getShopLabel()
  const variantSizes = getVariantSizes()
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock.unwrap(),
    0,
  )
  const isSoldOut = totalStock <= 0
  const isSaved = state.product.wishlistProductIDs.includes(product.id.unwrap())

  const formatPrice = (price: number) => {
    const formatNumber = (number: number) => {
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(number)
    }
    if (price >= 1_000_000_000) {
      return formatNumber(price / 1_000_000_000) + "B"
    }
    if (price >= 1_000_000) {
      return formatNumber(price / 1_000_000) + "M"
    }
    return formatNumber(price)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isUser) {
      emit((currentState) => [
        _RegisterState(currentState, {
          status: {
            _t: "Error",
            message: "Please login first to save products to your wishlist.",
          },
        }),
        cmd(perform(navigateTo(toRoute("Home", {})))),
      ])
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
      className={`${styles.card} ${isSoldOut ? styles.cardSoldOut : ""}`}
    >
      <>
        <div className={styles.imageContainer}>
          <button
            type="button"
            className={`wishlist-heart-btn ${styles.wishlistButton} ${
              isSaved ? styles.wishlistButtonActive : ""
            }`}
            onClick={handleToggleWishlist}
            aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            disabled={state.product.wishlistBusy}
          >
            {isSaved ? (
              <IoIosHeart
                size={18}
                className="wishlist-heart-icon"
              />
            ) : (
              <IoIosHeartEmpty
                size={18}
                className="wishlist-heart-icon"
              />
            )}
          </button>

          <img
            className={styles.image}
            src={
              product.url?.unwrap() ||
              "https://res.cloudinary.com/dmuxj8a3n/image/upload/v1774519592/at-logo-1_g1qq6a.jpg"
            }
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
              title={`${shopLabel} Profile`}
            >
              {`By ${shopLabel}`}
            </span>
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

          <div className={styles.price}>
            <span className={styles.coinBadge}>T</span>
            <span>{formatPrice(product.price.unwrap())}</span>
          </div>
        </div>

        {isSoldOut ? (
          <div className={styles.soldOutCardLayer}>
            <div className={styles.soldOutDiagonalStripe}>
              <span className={styles.soldOutText}>SOLD OUT</span>
            </div>
          </div>
        ) : null}
      </>
    </Link>
  )
}

const nameClass = css({
  ...font.bold17,
  color: color.neutral900,
  display: "-webkit-box",
  margin: theme.s0,
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "keep-all",
  minHeight: "44px",
  lineHeight: 1.35,
  transition: "color 0.22s ease",
})

const cardClass = css({
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--app-surface-strong)",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid var(--app-border)",
  textDecoration: "none",
  transition:
    "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.25s ease",
  cursor: "pointer",
  height: "100%",
  position: "relative",
  animation: `${fadeSlideUp} 0.4s ease both`,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 0 rgba(124,58,237,0)",
  "&:hover": {
    transform: "translateY(-8px) scale(1.015)",
    boxShadow: "0 20px 44px rgba(0,0,0,0.12), 0 0 0 2px rgba(124,58,237,0.18)",
    borderColor: "var(--app-brand-400)",
    [`& .${nameClass}`]: { color: "var(--app-accent)" },
  },
})

const wishlistButtonClass = css({
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(8px)",
  color: "var(--app-accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "1.5px solid rgba(255,255,255,0.7)",
  position: "absolute",
  top: "10px",
  right: "10px",
  transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
  cursor: "pointer",
  zIndex: 3,
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  "&:hover": {
    transform: "scale(1.18)",
    backgroundColor: color.neutral0,
    boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
    borderColor: "var(--app-brand-400)",
  },
  "&:active": {
    transform: "scale(0.9)",
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.5,
    transform: "none",
  },
})

const styles = {
  card: cardClass,
  cardSoldOut: css({
    opacity: 0.82,
    "&:hover": {
      transform: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      borderColor: "var(--app-border)",
    },
  }),
  name: nameClass,
  wishlistButton: wishlistButtonClass,
  wishlistButtonActive: css({
    backgroundColor: "rgba(255,255,255,0.96)",
    color: "#e53e3e",
    border: "1.5px solid rgba(229,62,62,0.35)",
    boxShadow: "0 0 0 3px rgba(229,62,62,0.12), 0 2px 8px rgba(0,0,0,0.1)",
  }),
  imageContainer: css({
    width: "100%",
    paddingTop: "108%",
    position: "relative",
    backgroundColor: color.neutral20,
    overflow: "hidden",
  }),
  imageHoverOverlay: css({
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, transparent 55%, rgba(15,15,26,0.38) 100%)",
    zIndex: 1,
    transition: "opacity 0.3s ease",
    opacity: 0,
  }),
  image: css({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    [`.${cardClass}:hover &`]: {
      transform: "scale(1.08)",
    },
  }),
  soldOutCardLayer: css({
    position: "absolute",
    inset: 0,
    background: "rgba(10, 10, 20, 0.48)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
    pointerEvents: "none",
    backdropFilter: "blur(1px)",
  }),
  soldOutDiagonalStripe: css({
    position: "absolute",
    left: "-54%",
    top: "40%",
    width: "220%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-52deg)",
    background:
      "linear-gradient(90deg, rgba(0,52,120,0.92) 0%, rgba(0,82,156,0.95) 50%, rgba(0,52,120,0.92) 100%)",
    padding: `${theme.s2} 0`,
    boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
  }),
  soldOutText: css({
    ...font.bold12,
    letterSpacing: "5px",
    color: color.neutral0,
    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
    textTransform: "uppercase",
  }),
  content: css({
    padding: `${theme.s3} ${theme.s4} ${theme.s4}`,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "10px",
  }),
  metaContainer: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  shopItem: css({
    padding: `3px ${theme.s2}`,
    color: color.neutral500,
    ...font.regular10,
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.18s ease",
    userSelect: "none",
    borderRadius: theme.brFull,
    background: "var(--app-brand-20)",
    border: "1px solid var(--app-border)",
    letterSpacing: "0.06em",
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    "&:hover": {
      color: "var(--app-accent)",
      background: "var(--app-accent-soft)",
      borderColor: "var(--app-brand-300)",
    },
    "&:focus": {
      outline: "none",
    },
  }),
  variantRow: css({
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    height: "48px",
    overflow: "hidden",
  }),
  variantItem: css({
    border: "1px solid var(--app-border)",
    color: "var(--app-text-soft)",
    background: "transparent",
    borderRadius: "6px",
    padding: `2px 8px`,
    ...font.regular10,
    letterSpacing: "0.04em",
    transition: "all 0.15s ease",
    height: "24px",
  }),
  variantItemOut: css({
    background: color.neutral100,
    borderColor: color.neutral200,
    color: color.neutral400,
    textDecoration: "line-through",
  }),
  priceRow: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  }),
  price: css({
    ...font.bold17,
    color: color.neutral900,
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s1,
  }),
  coinBadge: css({
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, var(--app-brand-500) 0%, var(--app-secondary-500) 100%)",
    color: color.neutral0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.bold10,
    lineHeight: 1,
    WebkitTextFillColor: color.neutral0,
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(124,58,237,0.3)",
  }),
  stockDot: css({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "var(--app-success-500)",
    flexShrink: 0,
    boxShadow: "0 0 5px rgba(72,187,120,0.5)",
  }),
}

// const wishlistButtonClass = css({
//   width: "36px",
//   height: "36px",
//   borderRadius: "50%",
//   backgroundColor: "rgba(255, 255, 255, 0.92)",
//   color: color.genz.purple,
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   padding: 0,
//   border: `1px solid ${color.genz.purple200}`,
//   position: "absolute",
//   top: theme.s2,
//   right: theme.s2,
//   transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
//   cursor: "pointer",
//   zIndex: 3,
//   "&:hover": {
//     transform: "scale(1.1)",
//     backgroundColor: color.neutral0,
//   },
//   "&:active": {
//     transform: "scale(0.95)",
//   },
//   "&:disabled": {
//     cursor: "not-allowed",
//     opacity: 0.6,
//     transform: "none",
//   },
// })

// const styles = {
//   card: css({
//     display: "flex",
//     flexDirection: "column",
//     backgroundColor: color.neutral0,
//     borderRadius: theme.br2,
//     overflow: "hidden",
//     border: `1px solid ${color.genz.purple100}`,
//     textDecoration: "none",
//     transition: "all 0.3s ease",
//     cursor: "pointer",
//     height: "100%",
//     position: "relative",
//     "&:hover": {
//       transform: "translateY(-6px)",
//       boxShadow: "0 10px 20px rgba(0, 0, 0, 0.08)",
//       borderColor: color.genz.pink200,
//       [`& .${nameClass}`]: { color: color.genz.pink },
//     },
//   }),
//   cardSoldOut: css({
//     "&:hover": {
//       transform: "none",
//       boxShadow: "none",
//       borderColor: color.genz.purple100,
//     },
//     "&:hover img": {
//       transform: "none",
//     },
//   }),
//   name: nameClass,
//   wishlistButton: wishlistButtonClass,
//   wishlistButtonActive: css({
//     backgroundColor: color.neutral0,
//     color: color.semantics.error.red500,
//     border: `1px solid ${color.semantics.error.red500}`,
//   }),
//   imageContainer: css({
//     width: "100%",
//     paddingTop: "100%",
//     position: "relative",
//     backgroundColor: color.neutral50,
//     overflow: "hidden",
//   }),
//   image: css({
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     objectFit: "cover",
//     objectPosition: "center",
//     transition: "transform 0.5s ease",
//     ".card:hover &": {
//       transform: "scale(1.05)",
//     },
//   }),
//   soldOutCardLayer: css({
//     position: "absolute",
//     inset: 0,
//     background: "rgba(18,24,38,0.42)",
//     overflow: "hidden",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 4,
//     pointerEvents: "none",
//   }),
//   soldOutDiagonalStripe: css({
//     position: "absolute",
//     left: "-54%",
//     top: "40%",
//     width: "220%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     transform: "rotate(-59deg)",
//     background: "rgba(26, 34, 51, 0.82)",
//     padding: `${theme.s3} 0`,
//   }),
//   soldOutText: css({
//     ...font.bold14,
//     letterSpacing: "4px",
//     color: color.neutral0,
//     textShadow: "0 1px 2px rgba(0,0,0,0.28)",
//   }),
//   content: css({
//     padding: theme.s4,
//     display: "flex",
//     flexDirection: "column",
//     flex: 1,
//     gap: theme.s2,
//   }),
//   metaContainer: css({
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: theme.s0,
//   }),
//   shopItem: css({
//     padding: `${theme.s1} ${theme.s1}`,
//     // backgroundColor: color.genz.purpleDim,
//     color: color.genz.purple,
//     ...font.regular10,
//     textTransform: "uppercase",
//     cursor: "pointer",
//     transition: "all 0.2s ease",
//     userSelect: "none",
//     borderBottom: `1px solid transparent`,

//     "&:hover": {
//       // backgroundColor: color.genz.purple100,
//       // borderColor: color.genz.purple200,
//       borderBottom: `1px solid ${color.genz.purple}`,
//     },
//     "&:focus": {
//       outline: "none",
//       borderColor: color.genz.pink200,
//     },
//   }),
//   variantRow: css({
//     display: "flex",
//     flexWrap: "wrap",
//     gap: theme.s1,
//   }),
//   variantItem: css({
//     border: `1px solid ${color.genz.purple200}`,
//     color: color.genz.purple,
//     background: color.neutral0,
//     borderRadius: theme.br1,
//     padding: `2px ${theme.s2}`,
//     ...font.medium12,
//   }),
//   variantItemOut: css({
//     background: color.neutral200,
//     borderColor: color.neutral300,
//     color: color.neutral600,
//   }),
//   price: css({
//     ...font.bold17,
//     color: color.genz.pink,
//     display: "inline-flex",
//     alignItems: "center",
//     marginLeft: "auto",
//     gap: theme.s1,
//   }),
//   coinBadge: css({
//     width: "16px",
//     height: "16px",
//     borderRadius: "50%",
//     backgroundColor: color.genz.pink,
//     color: color.semantics.warning.yellow500,
//     display: "inline-flex",
//     alignItems: "center",
//     justifyContent: "center",
//     ...font.bold10,
//     lineHeight: 1,
//   }),
// }
