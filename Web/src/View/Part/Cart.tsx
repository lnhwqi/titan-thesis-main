import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { color, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as CartAction from "../../Action/Cart"
import { navigateTo, toRoute } from "../../Route"

type Props = {
  state: State
}
export function CartSidebar(props: Props): JSX.Element {
  const { state } = props

  const { items, isOpen } = state.cart

  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price.unwrap() * item.quantity,
    0,
  )

  const getVariantID = (item: (typeof items)[number]) => {
    const firstVariant = item.product.variants[0]
    return firstVariant == null ? null : firstVariant.id.unwrap()
  }

  const getVariantLabel = (item: (typeof items)[number]) => {
    const firstVariant = item.product.variants[0]
    if (firstVariant == null) {
      return null
    }

    return firstVariant.name.unwrap()
  }

  const closeCart = () => emit(CartAction.toggleCart(false))

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.showOverlay : ""}`}
        onClick={closeCart}
      />

      <div className={`${styles.sidebar} ${isOpen ? styles.openSidebar : ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Cart({items.length})</h2>
          <button
            className={styles.closeBtn}
            onClick={closeCart}
          >
            ✕
          </button>
        </div>

        <div
          className={`${styles.itemList} ${items.length > 3 ? styles.itemListScrollable : ""}`}
        >
          {items.length === 0 ? (
            <div className={styles.empty}>Empty</div>
          ) : (
            items.map((item) => {
              const variantID = getVariantID(item)
              const variantLabel = getVariantLabel(item)

              return (
                <div
                  key={`${item.product.id.unwrap()}:${variantID ?? "default"}`}
                  className={styles.item}
                >
                  <img
                    src={item.product.url?.unwrap() || ""}
                    className={styles.itemImg}
                  />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>
                      {item.product.name.unwrap()}
                    </div>
                    {variantLabel != null ? (
                      <div className={styles.itemVariant}>{variantLabel}</div>
                    ) : null}
                    <div className={styles.itemPrice}>
                      {item.quantity} x{" "}
                      {item.product.price.unwrap().toLocaleString()}đ
                    </div>
                    <div className={styles.controls}>
                      <button
                        onClick={() =>
                          emit(
                            CartAction.updateQuantity(
                              item.product.id.unwrap(),
                              variantID,
                              -1,
                            ),
                          )
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          emit(
                            CartAction.updateQuantity(
                              item.product.id.unwrap(),
                              variantID,
                              1,
                            ),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total:</span>
              <span className={styles.totalPrice}>
                {totalPrice.toLocaleString()}đ
              </span>
            </div>
            <button
              className={styles.checkoutBtn}
              onClick={() => {
                closeCart()
                emit(navigateTo(toRoute("Payment", {})))
              }}
            >
              Payment
            </button>
          </div>
        )}
      </div>
    </>
  )
}
const styles = {
  overlay: css({
    position: "fixed",
    inset: 0,
    backgroundColor: "transparent",
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 0.2s ease",
    zIndex: 1000,
  }),
  showOverlay: css({
    opacity: 1,
    visibility: "visible",
  }),
  sidebar: css({
    position: "fixed",
    top: "74px",
    right: theme.s4,
    width: "360px",
    maxWidth: "calc(100dvw - 32px)",
    maxHeight: "calc(100dvh - 96px)",
    backgroundColor: color.neutral0,
    zIndex: 1001,
    transition: "opacity 0.22s ease, transform 0.22s ease",
    display: "flex",
    flexDirection: "column",
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    transform: "translateY(-8px) scale(0.98)",
    boxShadow:
      "0 22px 48px rgba(12, 20, 34, 0.24), 0 8px 20px rgba(12, 20, 34, 0.14)",
    borderRadius: theme.br2,
    border: `1px solid ${color.genz.purple100}`,
    overflow: "hidden",
  }),
  openSidebar: css({
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
    transform: "translateY(0) scale(1)",
  }),
  header: css({
    padding: theme.s4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${color.genz.purple100}`,
    background: "linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)",
  }),
  title: css({ ...font.bold17, color: color.genz.purple }),
  closeBtn: css({
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: `1px solid ${color.genz.purple200}`,
    background: color.neutral0,
    color: color.genz.purple,
    cursor: "pointer",
    fontSize: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    "&:hover": {
      background: color.genz.purpleDim,
      transform: "scale(1.05)",
    },
  }),
  itemList: css({ flex: 1, overflowY: "visible", padding: theme.s4 }),
  itemListScrollable: css({
    maxHeight: "300px",
    overflowY: "auto",
  }),
  item: css({
    display: "flex",
    gap: theme.s3,
    marginBottom: theme.s3,
    padding: theme.s3,
    borderRadius: theme.br1,
    border: `1px solid ${color.genz.purple100}`,
    background: color.neutral0,
  }),
  itemImg: css({
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: theme.br1,
    border: `1px solid ${color.genz.purple100}`,
  }),
  itemInfo: css({ flex: 1 }),
  itemName: css({
    ...font.medium14,
    marginBottom: "4px",
    color: color.genz.purple,
  }),
  itemVariant: css({
    ...font.regular12,
    color: color.genz.purple,
    marginBottom: "4px",
  }),
  itemPrice: css({ ...font.regular12, color: color.neutral500 }),
  controls: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
    marginTop: "8px",
    "& button": {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      border: `1px solid ${color.genz.purple200}`,
      background: color.neutral0,
      color: color.genz.purple,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    "& button:hover": {
      background: color.genz.purpleDim,
      transform: "translateY(-1px)",
    },
  }),
  footer: css({
    padding: theme.s4,
    borderTop: `1px solid ${color.genz.purple100}`,
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  }),
  totalRow: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.s4,
    ...font.bold17,
  }),
  totalPrice: css({ color: color.genz.pink }),
  checkoutBtn: css({
    width: "100%",
    padding: theme.s3,
    backgroundColor: color.genz.pink,
    color: color.neutral0,
    border: "none",
    borderRadius: theme.br2,
    ...font.bold17,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(14, 125, 112, 0.24)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: color.genz.purple,
      transform: "translateY(-1px)",
      boxShadow: "0 12px 24px rgba(10, 95, 86, 0.28)",
    },
  }),
  empty: css({
    textAlign: "center",
    marginTop: theme.s10,
    color: color.neutral400,
  }),
}
