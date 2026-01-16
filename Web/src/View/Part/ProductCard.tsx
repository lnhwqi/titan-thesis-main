import { css } from "@emotion/css"
import { JSX } from "react"
import { BasicProduct } from "../../../../Core/App/ProductBasic"
import Link from "../Link"
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"

type Props = {
  product: BasicProduct
}

export function ProductCard(props: Props): JSX.Element {
  const { product } = props

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
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
            src={
              product.url?.unwrap()
                ? product.url.unwrap()
                : "https://default-image.com"
            }
            alt={product.name.unwrap()}
            loading="lazy"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.category}>Category</div>
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
            <div className={styles.addButton}>+</div>
          </div>
        </div>
      </>
    </Link>
  )
}

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
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  backgroundColor: color.secondary100,
  color: color.secondary500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "bold",
  transition: "all 0.2s",
})

const cardClass = css({
  display: "flex",
  flexDirection: "column",
  backgroundColor: color.neutral0,
  borderRadius: theme.br2,
  overflow: "hidden",
  border: `1px solid ${color.secondary100}`,
  textDecoration: "none",
  transition: "all 0.2s ease",
  cursor: "pointer",
  height: "100%",

  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderColor: color.primary200,

    // Cú pháp chuẩn để tham chiếu class khác trong Emotion
    [`& .${nameClass}`]: {
      color: color.primary500,
    },
    [`& .${addButtonClass}`]: {
      backgroundColor: color.primary500,
      color: color.neutral0,
    },
  },
})

// Gom lại vào object styles để dùng cho gọn
const styles = {
  card: cardClass,
  name: nameClass,
  addButton: addButtonClass,

  imageContainer: css({
    width: "100%",
    paddingTop: "100%",
    position: "relative",
    backgroundColor: color.neutral50,
  }),
  image: css({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }),
  content: css({
    padding: theme.s3,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: theme.s1,
  }),
  category: css({
    ...font.regular12,
    color: color.neutral500,
  }),
  bottom: css({
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  price: css({
    ...font.bold14,
    color: color.primary500,
  }),
}
