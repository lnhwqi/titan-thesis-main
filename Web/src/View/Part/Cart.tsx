import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as CartAction from "../../Action/Cart"
import { navigateTo, toRoute } from "../../Route"

type Props = {
  state: State
}
export function CartSidebar(props: Props): JSX.Element {
  const { state } = props

  const { items, isOpen } = state.cart

  const getVariantPrice = (item: (typeof items)[number]): number => {
    const firstVariant = item.product.variants[0]
    if (firstVariant == null) {
      return item.product.price.unwrap()
    }

    return firstVariant.price.unwrap()
  }

  const totalPrice = items.reduce(
    (sum, item) => sum + getVariantPrice(item) * item.quantity,
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
                      {item.quantity} x {getVariantPrice(item).toLocaleString()}
                      đ
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
    backgroundColor: "rgba(18, 15, 32, 0.42)",
    backdropFilter: "blur(1px)",
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
    top: "82px",
    right: "clamp(10px, 2vw, 16px)",
    width: "min(360px, calc(100dvw - 20px))",
    maxHeight: "min(78dvh, calc(100dvh - 96px))",
    backgroundColor: "var(--app-surface-strong)",
    zIndex: 1001,
    transition: "opacity 0.22s ease, transform 0.22s ease",
    display: "flex",
    flexDirection: "column",
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    transform: "translateY(-8px) scale(0.98)",
    boxShadow: "var(--app-shadow-lg)",
    borderRadius: theme.br2,
    border: "1px solid var(--app-border)",
    overflow: "hidden",
    "@media (max-width: 640px)": {
      top: "auto",
      bottom: "12px",
      right: "10px",
      left: "10px",
      width: "auto",
      maxHeight: "70dvh",
      borderRadius: "14px",
      transform: "translateY(10px) scale(0.98)",
    },
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
    borderBottom: "1px solid var(--app-border)",
    background:
      "linear-gradient(180deg, var(--app-surface) 0%, var(--app-brand-20) 100%)",
  }),
  title: css({ ...font.bold17, color: "var(--app-accent)" }),
  closeBtn: css({
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid var(--app-border)",
    background: "var(--app-surface-strong)",
    color: "var(--app-accent)",
    cursor: "pointer",
    fontSize: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "var(--app-brand-20)",
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
    border: "1px solid var(--app-border)",
    background: "var(--app-surface)",
  }),
  itemImg: css({
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: theme.br1,
    border: "1px solid var(--app-border)",
  }),
  itemInfo: css({ flex: 1 }),
  itemName: css({
    ...font.medium14,
    marginBottom: "4px",
    color: "var(--app-accent)",
  }),
  itemVariant: css({
    ...font.regular12,
    color: "var(--app-accent)",
    marginBottom: "4px",
  }),
  itemPrice: css({ ...font.regular12, color: "var(--app-text-soft)" }),
  controls: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
    marginTop: "8px",
    "& button": {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      border: "1px solid var(--app-border)",
      background: "var(--app-surface-strong)",
      color: "var(--app-accent)",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    "& button:hover": {
      background: "var(--app-brand-20)",
      transform: "translateY(-1px)",
    },
  }),
  footer: css({
    padding: theme.s4,
    borderTop: "1px solid var(--app-border)",
    background:
      "linear-gradient(180deg, var(--app-surface) 0%, var(--app-brand-20) 100%)",
  }),
  totalRow: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.s4,
    ...font.bold17,
  }),
  totalPrice: css({ color: "var(--app-secondary-500)" }),
  checkoutBtn: css({
    width: "100%",
    padding: theme.s3,
    background:
      "linear-gradient(135deg, var(--app-brand-500) 0%, var(--app-secondary-500) 100%)",
    color: "var(--app-accent-contrast)",
    border: "none",
    borderRadius: theme.br2,
    ...font.bold17,
    cursor: "pointer",
    boxShadow: "var(--app-shadow-sm)",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "var(--app-shadow-md)",
    },
  }),
  empty: css({
    textAlign: "center",
    marginTop: theme.s10,
    color: "var(--app-text-muted)",
  }),
}
