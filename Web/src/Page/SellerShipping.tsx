import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import * as SellerDashboardAction from "../Action/SellerDashboard"
import { navigateTo, toRoute } from "../Route"
import { ShippingStatus } from "../State/SellerDashboard"

type Props = { state: State }

const statuses: ShippingStatus[] = [
  "PACKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
]

function toShippingStatus(value: string): ShippingStatus {
  switch (value) {
    case "PACKED":
    case "PICKED_UP":
    case "IN_TRANSIT":
    case "DELIVERED":
      return value
    default:
      return "PACKED"
  }
}

export default function SellerShippingPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return <div className={styles.page}>Seller access required.</div>
  }

  const myProducts =
    state.product.listResponse._t === "Success"
      ? state.product.listResponse.data.items.filter(
          (item) => item.sellerID.unwrap() === auth.sellerID.unwrap(),
        )
      : []

  const trackedProductIDs = new Set(
    Object.keys(state.sellerDashboard.shippingStatusByProductId),
  )

  const boughtOrders = myProducts.filter((item) =>
    trackedProductIDs.has(item.id.unwrap()),
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shipping Tracker</h1>
          <p className={styles.subtitle}>
            Track shipment progress for orders that have been bought by users.
          </p>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
        >
          Back to Dashboard
        </button>
      </header>

      <section className={styles.panel}>
        {boughtOrders.length === 0 ? (
          <div className={styles.empty}>
            No bought orders available for shipping tracking.
          </div>
        ) : (
          <div className={styles.list}>
            {boughtOrders.map((product) => {
              const productID = product.id.unwrap()
              const status =
                state.sellerDashboard.shippingStatusByProductId[productID] ??
                "PACKED"

              return (
                <article
                  key={productID}
                  className={styles.card}
                >
                  <div>
                    <div className={styles.productName}>
                      {product.name.unwrap()}
                    </div>
                    <div className={styles.meta}>
                      SKU: {product.variants[0]?.sku.unwrap() ?? "-"}
                    </div>
                  </div>

                  <select
                    className={styles.select}
                    value={status}
                    onChange={(e) =>
                      emit(
                        SellerDashboardAction.setShippingStatus(
                          product.id,
                          toShippingStatus(e.currentTarget.value),
                        ),
                      )
                    }
                  >
                    {statuses.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
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
    gap: theme.s3,
    marginBottom: theme.s4,
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s1,
  }),
  panel: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
  }),
  list: css({
    display: "grid",
    gap: theme.s3,
  }),
  card: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
  }),
  productName: css({
    ...font.bold14,
    color: color.neutral900,
  }),
  meta: css({
    ...font.regular12,
    color: color.neutral700,
  }),
  select: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  empty: css({
    ...font.regular14,
    color: color.neutral700,
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
