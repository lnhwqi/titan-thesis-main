import { css } from "@emotion/css"
import { JSX } from "react"
import { BasicProduct } from "../../../../Core/App/ProductBasic"
import Link from "../Link"
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { State } from "../../State"
import { emit } from "../../Runtime/React"
import * as CartAction from "../../Action/Cart"

type Props = {
  product: BasicProduct
  state: State
}

export function ProductCard(props: Props): JSX.Element {
  const { product, state } = props
  const { treeResponse } = state.category

  // Lấy tên danh mục để hiển thị trên badge của card
  const getCategoryName = () => {
    if (state.product.currentCategoryTree) {
      return state.product.currentCategoryTree.name.unwrap()
    }

    const firstCatId = product.categoryIDs[0]
    if (firstCatId && treeResponse._t === "Success") {
      const found = treeResponse.data.find(
        (c) => c.id.unwrap() === firstCatId.unwrap(),
      )
      if (found) return found.name.unwrap()
    }

    return "Fashion"
  }

  const categoryName = getCategoryName()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Ngăn Link chuyển trang khi nhấn vào nút +
    e.stopPropagation() // Ngăn sự kiện click nổi bọt lên thẻ Link cha
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
          </div>

          <h3
            className={styles.name}
            title={product.name.unwrap()}
          >
            {product.name.unwrap()}
          </h3>

          <div className={styles.bottom}>
            <div className={styles.price}>
              {formatPrice(product.price.unwrap())}
            </div>
            <div
              className={styles.addButton}
              onClick={handleAddToCart}
              aria-label="Thêm vào giỏ hàng"
            >
              +
            </div>
          </div>
        </div>
      </>
    </Link>
  )
}

// --- STYLES ---

const nameClass = css({
  ...font.medium14,
  color: color.neutral900,
  marginBottom: theme.s2,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  height: "40px",
  transition: "color 0.2s",
})

const addButtonClass = css({
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  backgroundColor: color.secondary100,
  color: color.secondary500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: "bold",
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
    marginBottom: theme.s1,
  }),
  categoryItem: css({
    padding: `${theme.s1} ${theme.s2}`,
    backgroundColor: color.secondary50,
    color: color.secondary500,
    borderRadius: theme.br1,
    ...font.medium12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  bottom: css({
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.s2,
  }),
  price: css({
    ...font.bold14,
    color: color.primary500,
  }),
}
