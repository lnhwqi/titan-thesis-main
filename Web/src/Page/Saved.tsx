import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { ProductCard } from "../View/Part/ProductCard"

export type SavedPageProps = { state: State }

export default function SavedPage(props: SavedPageProps): JSX.Element {
  const { state } = props

  const isAuthUser = state._t === "AuthUser"

  if (isAuthUser === false) {
    return (
      <div className={styles.container}>
        <div className={styles.noticeCard}>
          <h1 className={styles.noticeTitle}>Saved Products</h1>
          <p className={styles.noticeText}>
            Please log in as user to access your wishlist.
          </p>
        </div>
      </div>
    )
  }

  const savedIds = new Set(state.product.wishlistProductIDs)
  const savedProducts =
    state.product.listResponse._t === "Success"
      ? state.product.listResponse.data.items.filter((item) =>
          savedIds.has(item.id.unwrap()),
        )
      : []

  return (
    <div className={styles.container}>
      <div className={styles.pageContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>Saved Products</h1>
          <div className={styles.subtitle}>
            {savedProducts.length} item{savedProducts.length === 1 ? "" : "s"}
          </div>
          <div className={styles.divider} />
        </div>

        {state.product.listResponse._t === "Loading" ? (
          <div className={styles.info}>Loading products...</div>
        ) : null}

        {state.product.listResponse._t === "Failure" ? (
          <div className={styles.info}>Could not load products right now.</div>
        ) : null}

        {state.product.listResponse._t === "Success" &&
        savedProducts.length === 0 ? (
          <div className={styles.info}>You have no saved products yet.</div>
        ) : null}

        {savedProducts.length > 0 ? (
          <div className={styles.grid}>
            {savedProducts.map((product) => (
              <div
                key={product.id.unwrap()}
                className={styles.savedItem}
              >
                <ProductCard
                  product={product}
                  state={state}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    padding: `${theme.s0} ${theme.s4}`,
    ...bp.xl({
      padding: theme.s0,
    }),
  }),
  pageContent: css({
    ...font.regular14,
    color: color.neutral800,
    backgroundColor: color.neutral0,
    padding: theme.s6,
    borderRadius: theme.br2,
    minHeight: "100%",
  }),
  header: css({
    marginBottom: theme.s6,
  }),
  title: css({
    ...font.bold17,
    color: color.genz.purple,
    margin: 0,
  }),
  divider: css({
    width: "40px",
    height: "3px",
    backgroundColor: color.genz.purple,
    borderRadius: theme.br1,
    marginTop: theme.s2,
  }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s1,
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 220px))",
    justifyContent: "start",
    gap: theme.s4,
    paddingBottom: theme.s10,
  }),
  savedItem: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    position: "relative",
    "& .wishlist-heart-btn": {
      opacity: 0.72,
      transform: "translateY(4px) scale(0.92)",
    },
    "& .wishlist-heart-icon": {
      transform: "rotate(0deg)",
      transition: "transform 0.24s ease",
    },
    "&:hover .wishlist-heart-btn": {
      opacity: 1,
      transform: "translateY(0) scale(1)",
    },
    "&:hover .wishlist-heart-icon": {
      transform: "rotate(360deg)",
    },
  }),
  info: css({
    ...font.regular14,
    color: color.neutral500,
    textAlign: "center",
    marginTop: theme.s10,
  }),
  noticeCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.br2,
    padding: theme.s6,
  }),
  noticeTitle: css({
    ...font.bold17,
    color: color.genz.purple,
    margin: 0,
    marginBottom: theme.s2,
  }),
  noticeText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
}
