import { JSX } from "react"
import { css } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { color, font, theme } from "../View/Theme"
import { ProductCard } from "../View/Part/ProductCard"

export type SellerProfilePageProps = { state: AuthState | PublicState }

export default function SellerProfilePage(
  props: SellerProfilePageProps,
): JSX.Element {
  const { state } = props
  const sellerRD = state.product.sellerProfileResponse
  const productsRD = state.product.sellerProductsResponse

  if (sellerRD._t === "Loading") {
    return <div className={styles.statusMsg}>Loading seller profile...</div>
  }

  if (sellerRD._t === "Failure") {
    return <div className={styles.statusMsg}>Seller profile not found.</div>
  }

  if (sellerRD._t !== "Success") {
    return <></>
  }

  const seller = sellerRD.data.seller
  const products =
    productsRD._t === "Success"
      ? productsRD.data.items
      : state.product.listResponse._t === "Success"
        ? state.product.listResponse.data.items.filter(
            (item) => item.sellerID.unwrap() === seller.id.unwrap(),
          )
        : []

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.shopName}>{seller.shopName.unwrap()}</div>
        <p className={styles.shopDescription}>
          {seller.shopDescription.unwrap()}
        </p>
      </section>

      <section className={styles.productsSection}>
        <h2 className={styles.productsTitle}>Products from this shop</h2>

        {productsRD._t === "Loading" ? (
          <div className={styles.statusMsg}>Loading products...</div>
        ) : products.length === 0 ? (
          <div className={styles.statusMsg}>No products available yet.</div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id.unwrap()}
                product={product}
                state={state}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const styles = {
  container: css({
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: `${theme.s6} ${theme.s4}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s6,
  }),
  hero: css({
    background: color.secondary50,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.br2,
    padding: theme.s6,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
  }),
  shopName: css({
    ...font.boldH2_35,
    color: color.secondary500,
  }),
  shopDescription: css({
    ...font.regular17,
    color: color.neutral800,
    margin: 0,
  }),
  productsSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  productsTitle: css({
    ...font.boldH5_20,
    color: color.neutral900,
    margin: 0,
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 240px))",
    justifyContent: "start",
    gap: theme.s4,
  }),
  statusMsg: css({
    ...font.medium14,
    color: color.neutral600,
    padding: theme.s8,
    textAlign: "center",
  }),
}
