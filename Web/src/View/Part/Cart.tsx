import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { color, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as CartAction from "../../Action/Cart"

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

  const closeCart = () => emit(CartAction.toggleCart(false))

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.showOverlay : ""}`}
        onClick={closeCart}
      />

      <div className={`${styles.sidebar} ${isOpen ? styles.openSidebar : ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Giỏ hàng ({items.length})</h2>
          <button
            className={styles.closeBtn}
            onClick={closeCart}
          >
            ✕
          </button>
        </div>

        <div className={styles.itemList}>
          {items.length === 0 ? (
            <div className={styles.empty}>Chưa có sản phẩm nào</div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id.unwrap()}
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
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Tổng cộng:</span>
              <span className={styles.totalPrice}>
                {totalPrice.toLocaleString()}đ
              </span>
            </div>
            <button className={styles.checkoutBtn}>Thanh toán ngay</button>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    opacity: 0,
    visibility: "hidden",
    transition: "all 0.3s ease",
    zIndex: 1000,
  }),
  showOverlay: css({
    opacity: 1,
    visibility: "visible",
  }),
  sidebar: css({
    position: "fixed",
    top: 0,
    right: -400, // Hidden by default
    width: "350px",
    height: "100%",
    backgroundColor: color.neutral0,
    zIndex: 1001,
    transition: "right 0.3s ease-out",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
  }),
  openSidebar: css({
    right: 0, // Slide in
  }),
  header: css({
    padding: theme.s4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${color.secondary100}`,
  }),
  title: css({ ...font.bold17 }),
  closeBtn: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "20px",
  }),
  itemList: css({ flex: 1, overflowY: "auto", padding: theme.s4 }),
  item: css({ display: "flex", gap: theme.s3, marginBottom: theme.s4 }),
  itemImg: css({
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: theme.br1,
  }),
  itemInfo: css({ flex: 1 }),
  itemName: css({ ...font.medium14, marginBottom: "4px" }),
  itemPrice: css({ ...font.regular12, color: color.neutral500 }),
  controls: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
    marginTop: "8px",
  }),
  footer: css({
    padding: theme.s4,
    borderTop: `1px solid ${color.secondary100}`,
  }),
  totalRow: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.s4,
    ...font.bold17,
  }),
  totalPrice: css({ color: color.primary500 }),
  checkoutBtn: css({
    width: "100%",
    padding: theme.s3,
    backgroundColor: color.primary500,
    color: color.neutral0,
    border: "none",
    borderRadius: theme.br2,
    ...font.bold17,
    cursor: "pointer",
    "&:hover": { backgroundColor: color.secondary500 },
  }),
  empty: css({
    textAlign: "center",
    marginTop: theme.s10,
    color: color.neutral400,
  }),
}
