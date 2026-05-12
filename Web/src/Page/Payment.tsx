import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as PaymentAction from "../Action/Payment"
import * as CartAction from "../Action/Cart"
import { navigateTo, toRoute } from "../Route"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import { CartItem } from "../State/Cart"

type Props = { state: State }

export default function PaymentPage(props: Props): JSX.Element {
  const { state } = props

  if (!("updateProfile" in state)) {
    return (
      <div className={styles.page}>
        <div className={styles.notice}>Please login to continue payment.</div>
      </div>
    )
  }

  const grouped = state.cart.items.reduce<
    Record<
      string,
      {
        sellerID: (typeof state.cart.items)[number]["product"]["sellerID"]
        shopName: string
        items: Array<{
          productID: string
          variantID: string | null
          stock: number
          name: string
          quantity: number
          linePrice: number
        }>
        subtotal: number
      }
    >
  >((acc, item) => {
    const sellerKey = item.product.sellerID.unwrap()
    const current = acc[sellerKey]
    const variant = item.product.variants[0]
    const linePrice =
      (variant == null ? item.product.price.unwrap() : variant.price.unwrap()) *
      item.quantity

    const nextItem = {
      productID: item.product.id.unwrap(),
      variantID: getVariantID(item),
      stock: getMaxStock(item),
      name: formatProductDisplayName(item),
      quantity: item.quantity,
      linePrice,
    }

    const basePanel = current ?? {
      sellerID: item.product.sellerID,
      shopName:
        state.payment.sellerShopNameByID[sellerKey] ??
        item.product.shopName?.unwrap() ??
        `Shop ${sellerKey.slice(0, 8)}`,
      items: [],
      subtotal: 0,
    }

    return {
      ...acc,
      [sellerKey]: {
        ...basePanel,
        items: [...basePanel.items, nextItem],
        subtotal: basePanel.subtotal + linePrice,
      },
    }
  }, {})

  const panels = Object.values(grouped)
  const grandTotal = panels.reduce((sum, panel) => sum + panel.subtotal, 0)

  return (
    <div className={styles.page}>
      {state.payment.priceChangedVisible ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Prices Have Changed</h3>
            <p className={styles.modalText}>
              One or more product prices have been updated by the seller. Your
              cart has been refreshed with the latest prices. Please review your
              order and try again.
            </p>
            <button
              className={styles.modalBtn}
              onClick={() => emit(PaymentAction.dismissPriceChanged())}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {state.payment.flashMessage != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Notice</h3>
            <p className={styles.modalText}>{state.payment.flashMessage}</p>
            <button
              className={styles.modalBtn}
              onClick={() => emit(PaymentAction.clearFlashMessage())}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payment</h1>
          <p className={styles.subtitle}>
            Confirm shipping address and voucher by each shop panel.
          </p>
        </div>
        <button
          className={styles.secondaryBtn}
          onClick={() => emit(navigateTo(toRoute("Home", {})))}
        >
          Back Home
        </button>
      </header>

      <section className={styles.panel}>
        <div className={styles.field}>
          <span className={styles.label}>Receiver</span>
          <InputText
            value={state.profile.name.unwrap()}
            type="text"
            invalid={false}
            disabled={true}
            onChange={() => undefined}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Province / City</span>
          <select
            className={styles.select}
            value={state.payment.selectedProvinceID ?? ""}
            onChange={(e) => {
              const val = e.currentTarget.value
              if (val !== "") {
                emit(PaymentAction.onSelectProvince(Number(val)))
              }
            }}
          >
            <option value="">-- Select Province --</option>
            {state.payment.provinces.map((p) => (
              <option
                key={p.ProvinceID}
                value={p.ProvinceID}
              >
                {p.ProvinceName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>District</span>
          <select
            className={styles.select}
            value={state.payment.selectedDistrictID ?? ""}
            disabled={state.payment.selectedProvinceID == null}
            onChange={(e) => {
              const val = e.currentTarget.value
              if (val !== "") {
                emit(PaymentAction.onSelectDistrict(Number(val)))
              }
            }}
          >
            <option value="">-- Select District --</option>
            {state.payment.districts.map((d) => (
              <option
                key={d.DistrictID}
                value={d.DistrictID}
              >
                {d.DistrictName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Ward</span>
          <select
            className={styles.select}
            value={state.payment.selectedWardCode ?? ""}
            disabled={state.payment.selectedDistrictID == null}
            onChange={(e) => {
              const val = e.currentTarget.value
              if (val !== "") {
                emit(PaymentAction.onSelectWard(val))
              }
            }}
          >
            <option value="">-- Select Ward --</option>
            {state.payment.wards.map((w) => (
              <option
                key={w.WardCode}
                value={w.WardCode}
              >
                {w.WardName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>House Number & Street Name</span>
          <InputText
            value={state.payment.addressDetail}
            type="text"
            invalid={false}
            placeholder="e.g. 123 Nguyen Hue Street"
            onChange={(v) => emit(PaymentAction.onChangeAddress(v))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Payment Method</span>
          <div className={styles.paymentMethodRow}>
            <div className={styles.paymentMethodTag}>Wallet</div>
            <div className={styles.paymentMethodTag}>
              Wallet: {formatT(state.profile.wallet.unwrap())}
            </div>
            <button
              className={styles.linkButton}
              onClick={() => emit(navigateTo(toRoute("WalletDeposit", {})))}
            >
              Deposit
            </button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Shop Panels</h2>

        {panels.length === 0 ? (
          <div className={styles.notice}>Your cart is empty.</div>
        ) : (
          <div className={styles.panelList}>
            {panels.map((panel) => {
              const vouchers = state.payment.mineVouchers.filter(
                (voucher) =>
                  voucher.sellerID.unwrap() === panel.sellerID.unwrap() &&
                  voucher.active.unwrap(),
              )

              return (
                <article
                  key={panel.sellerID.unwrap()}
                  className={styles.shopPanel}
                >
                  <div className={styles.shopName}>{panel.shopName}</div>
                  <div className={styles.itemList}>
                    {panel.items.map((item, index) => (
                      <div
                        key={`${panel.sellerID.unwrap()}-${index}`}
                        className={styles.itemRow}
                      >
                        <div className={styles.itemLeft}>
                          <span>{item.name}</span>
                          <div className={styles.qtyControls}>
                            <button
                              type="button"
                              className={styles.qtyButton}
                              onClick={() =>
                                emit(
                                  CartAction.updateQuantity(
                                    item.productID,
                                    item.variantID,
                                    -1,
                                  ),
                                )
                              }
                            >
                              -
                            </button>
                            <input
                              className={styles.qtyInput}
                              type="number"
                              min={1}
                              max={item.stock}
                              value={item.quantity}
                              onChange={(e) => {
                                const parsed = Number(e.currentTarget.value)
                                if (Number.isFinite(parsed) === false) {
                                  return
                                }

                                if (parsed > item.stock) {
                                  emit(
                                    PaymentAction.showFlashMessage(
                                      `Maximum stock is ${item.stock} for ${item.name}.`,
                                    ),
                                  )
                                }

                                const nextQty = Math.max(
                                  1,
                                  Math.min(Math.floor(parsed), item.stock),
                                )
                                const delta = nextQty - item.quantity
                                if (delta !== 0) {
                                  emit(
                                    CartAction.updateQuantity(
                                      item.productID,
                                      item.variantID,
                                      delta,
                                    ),
                                  )
                                }
                              }}
                            />
                            <button
                              type="button"
                              className={styles.qtyButton}
                              onClick={() => {
                                if (item.quantity >= item.stock) {
                                  emit(
                                    PaymentAction.showFlashMessage(
                                      `Maximum stock reached for ${item.name}.`,
                                    ),
                                  )
                                  return
                                }

                                emit(
                                  CartAction.updateQuantity(
                                    item.productID,
                                    item.variantID,
                                    1,
                                  ),
                                )
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() =>
                                emit(
                                  CartAction.updateQuantity(
                                    item.productID,
                                    item.variantID,
                                    -item.quantity,
                                  ),
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <span>{formatT(item.linePrice)}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.row}>
                    Subtotal: {formatT(panel.subtotal)}
                  </div>
                  <div className={styles.field}>
                    <span className={styles.label}>Voucher</span>
                    <select
                      className={styles.select}
                      value={
                        state.payment.selectedVoucherBySellerID[
                          panel.sellerID.unwrap()
                        ] ?? ""
                      }
                      onChange={(e) =>
                        emit(
                          PaymentAction.selectVoucher(
                            panel.sellerID.unwrap(),
                            e.currentTarget.value === ""
                              ? null
                              : e.currentTarget.value,
                          ),
                        )
                      }
                    >
                      <option value="">No voucher</option>
                      {vouchers.map((voucher) => (
                        <option
                          key={voucher.id.unwrap()}
                          value={voucher.id.unwrap()}
                        >
                          {voucher.code.unwrap()} (-
                          {formatT(voucher.discount.unwrap())}, min{" "}
                          {formatT(voucher.minOrderValue.unwrap())})
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.total}>Grand Total: {formatT(grandTotal)}</div>
        <Button
          theme_={"Red"}
          size={"M"}
          label={
            state.payment.submitResponse._t === "Loading"
              ? "Processing..."
              : "Pay With Wallet"
          }
          onClick={() => emit(PaymentAction.submitPayment())}
          disabled={
            state.payment.submitResponse._t === "Loading" || panels.length === 0
          }
        />
      </section>
    </div>
  )
}

function getVariantID(item: CartItem): string | null {
  const firstVariant = item.product.variants[0]
  return firstVariant == null ? null : firstVariant.id.unwrap()
}

function getMaxStock(item: CartItem): number {
  const firstVariant = item.product.variants[0]
  if (firstVariant == null) {
    return Number.MAX_SAFE_INTEGER
  }

  const stock = firstVariant.stock.unwrap()
  return stock < 1 ? 1 : stock
}

function formatProductDisplayName(item: CartItem): string {
  const baseName = item.product.name.unwrap()
  const firstVariant = item.product.variants[0]

  if (firstVariant == null) {
    return baseName
  }

  const fromName = firstVariant.name.unwrap().split("-").at(-1)
  const parsedFromName = fromName != null ? fromName.trim().toUpperCase() : ""
  if (parsedFromName !== "") {
    return `${baseName} - ${parsedFromName}`
  }

  const fromSku = firstVariant.sku.unwrap().split("-").at(-1)
  const parsedFromSku = (fromSku ?? "").trim().toUpperCase()
  if (parsedFromSku !== "") {
    return `${baseName} - ${parsedFromSku}`
  }

  return baseName
}

function formatT(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.s4,
    gap: theme.s2,
  }),
  title: css({ ...font.boldH4_24, margin: 0 }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s1,
  }),
  panel: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    marginBottom: theme.s3,
  }),
  sectionTitle: css({ ...font.bold17, color: color.genz.purple, margin: 0 }),
  panelList: css({ display: "grid", gap: theme.s3, marginTop: theme.s3 }),
  shopPanel: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s2,
    padding: theme.s3,
    display: "grid",
    gap: theme.s2,
  }),
  shopName: css({ ...font.bold14, color: color.genz.purple }),
  itemList: css({
    display: "grid",
    gap: theme.s1,
    padding: `${theme.s2} 0`,
    borderTop: `1px dashed ${color.genz.purple100}`,
    borderBottom: `1px dashed ${color.genz.purple100}`,
  }),
  itemRow: css({
    ...font.regular13,
    color: color.neutral700,
    display: "flex",
    justifyContent: "space-between",
    gap: theme.s2,
  }),
  itemLeft: css({
    display: "grid",
    gap: theme.s1,
  }),
  qtyControls: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s1,
  }),
  qtyButton: css({
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    cursor: "pointer",
  }),
  qtyInput: css({
    width: "56px",
    textAlign: "center",
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s1,
    padding: `${theme.s1}`,
    ...font.regular12,
  }),
  removeButton: css({
    border: `1px solid ${color.semantics.error.red500}`,
    background: color.semantics.error.red50,
    color: color.semantics.error.red500,
    borderRadius: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    ...font.medium12,
    cursor: "pointer",
  }),
  row: css({ ...font.regular14, color: color.neutral700 }),
  field: css({ display: "grid", gap: theme.s1 }),
  label: css({ ...font.medium14, color: color.neutral700 }),
  select: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  paymentMethodTag: css({
    width: "fit-content",
    border: `1px solid ${color.genz.pink}`,
    borderRadius: theme.s2,
    background: color.genz.pinkDim,
    color: color.genz.pink,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium14,
  }),
  paymentMethodRow: css({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.s2,
    alignItems: "center",
  }),
  linkButton: css({
    border: "none",
    background: "transparent",
    color: color.genz.pink,
    textDecoration: "underline",
    cursor: "pointer",
    ...font.medium14,
    padding: 0,
  }),
  total: css({
    ...font.bold17,
    marginBottom: theme.s3,
    color: color.genz.pink,
  }),
  notice: css({
    ...font.regular14,
    color: color.neutral700,
    textAlign: "center",
  }),
  secondaryBtn: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  modalOverlay: css({
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100,
  }),
  modalCard: css({
    width: "100%",
    maxWidth: "420px",
    background: color.neutral0,
    borderRadius: theme.s3,
    border: `1px solid ${color.genz.purple100}`,
    padding: theme.s4,
    textAlign: "center",
    display: "grid",
    gap: theme.s2,
  }),
  modalTitle: css({ ...font.bold17, margin: 0, color: color.genz.purple }),
  modalText: css({ ...font.regular14, margin: 0, color: color.neutral700 }),
  modalBtn: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
