import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as CartAction from "../Action/Cart"
import * as ProductAction from "../Action/Product"
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io"

export type ProductDetailPageProps = { state: AuthState | PublicState }

export default function ProductDetailPage(
  props: ProductDetailPageProps,
): JSX.Element {
  const { state } = props
  const detailRD = state.product.detailResponse
  const currentIndex = state.product.currentImageIndex

  if (detailRD._t === "Loading") {
    return <div className={styles.statusMsg}>Đang tải sản phẩm...</div>
  }

  if (detailRD._t === "Failure") {
    return (
      <div className={styles.statusMsg}>Không tìm thấy thông tin sản phẩm.</div>
    )
  }

  if (detailRD._t !== "Success") {
    return <></>
  }

  const product = detailRD.data
  const images = product.urls

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
            <h1 className={styles.productName}>{product.name.unwrap()}</h1>
            <div className={styles.priceTag}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(product.price.unwrap())}
            </div>
            <p className={styles.description}>{product.description.unwrap()}</p>
            <button
              className={styles.addToCartBtn}
              onClick={() => emit(CartAction.addToCart(product))}
            >
              Add To Cart
            </button>
          </div>
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
  }),
  description: css({
    ...font.regular17,
    color: color.neutral600,
    lineHeight: "1.6",
    margin: `${theme.s4} 0`,
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
  }),
  statusMsg: css({
    padding: theme.s20,
    textAlign: "center",
    ...font.medium14,
    color: color.neutral500,
  }),
}
