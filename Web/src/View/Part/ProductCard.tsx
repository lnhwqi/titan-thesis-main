import { css } from "@emotion/css"
import { JSX } from "react"
import { BasicProduct } from "../../../../Core/App/ProductBasic"
import { Category } from "../../../../Core/App/Category"
import Link from "../Link"
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { State } from "../../State"
import { emit } from "../../Runtime/React"
import * as CartAction from "../../Action/Cart"
import { IoMdCart } from "react-icons/io"

type Props = {
  product: BasicProduct
  state: State
}

export function ProductCard(props: Props): JSX.Element {
  const { product, state } = props
  const { treeResponse } = state.category

  const getCategoryName = () => {
    const categoryId = product.categoryID
    if (categoryId != null && treeResponse._t === "Success") {
      const found = findCategoryByID(treeResponse.data, categoryId.unwrap())
      if (found != null) {
        return found.name.unwrap()
      }
    }

    return "Uncategorized"
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

  const categoryName = getCategoryName()
  const variantSizes = getVariantSizes()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    emit(CartAction.addToCart(product))
  }

  return (
    <Link
      route={toRoute("ProductDetail", { id: product.id.unwrap() })}
      className={styles.card}
    >
      <>
        <div className={styles.imageContainer}>
          <img
            className={styles.image}
            src={product.url?.unwrap() || "https://via.placeholder.com/300"}
            alt={product.name.unwrap()}
            loading="lazy"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.categoryContainer}>
            <span className={styles.categoryItem}>{categoryName}</span>
            <div className={styles.price}>
              {formatPrice(product.price.unwrap())}
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

          <div className={styles.bottom}>
            <button
              type="button"
              className={styles.addButton}
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              <IoMdCart size={18} />
            </button>
          </div>
        </div>
      </>
    </Link>
  )
}

function findCategoryByID(
  categories: Category[],
  categoryID: string,
): Category | null {
  for (const category of categories) {
    if (category.id.unwrap() === categoryID) {
      return category
    }

    const child = findCategoryByID(category.children, categoryID)
    if (child != null) {
      return child
    }
  }

  return null
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

const addButtonClass = css({
  width: "90%",
  height: "36px",
  borderRadius: theme.br1,
  backgroundColor: color.secondary100,
  color: color.secondary500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  zIndex: 2,
  "&:hover": {
    transform: "scale(1.15)",
    backgroundColor: color.primary500,
    color: color.neutral0,
  },
  "&:active": {
    transform: "scale(0.95)",
  },
  margin: "auto",
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
  addButton: addButtonClass,
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
  categoryContainer: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.s0,
  }),
  categoryItem: css({
    padding: `${theme.s1} ${theme.s4}`,
    backgroundColor: color.secondary50,
    color: color.secondary500,
    borderRadius: theme.br1,
    ...font.medium12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
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
  bottom: css({
    marginTop: "auto",
    display: "block",
    paddingTop: theme.s2,
  }),
  price: css({
    ...font.bold17,
    color: color.primary500,
  }),
}
