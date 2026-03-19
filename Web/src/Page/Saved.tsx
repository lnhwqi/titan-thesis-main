import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { ProductCard } from "../View/Part/ProductCard"
import { emit } from "../Runtime/React"
import * as ProductAction from "../Action/Product"
import { IoIosClose } from "react-icons/io"

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
                <button
                  className={`${styles.removeButton} wishlist-remove-btn`}
                  onClick={() =>
                    emit(ProductAction.removeFromWishlist(product.id))
                  }
                  disabled={state.product.wishlistBusy}
                  aria-label={`Remove ${product.name.unwrap()} from wishlist`}
                  title="Remove from wishlist"
                >
                  {state.product.wishlistBusy ? (
                    <span className={styles.removeLabel}>...</span>
                  ) : (
                    <>
                      <IoIosClose
                        size={18}
                        className="wishlist-remove-icon"
                      />
                      <span className={styles.removeLabel}>Remove</span>
                    </>
                  )}
                </button>
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
    color: color.secondary500,
    margin: 0,
  }),
  divider: css({
    width: "40px",
    height: "3px",
    backgroundColor: color.secondary500,
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
    "& .wishlist-remove-btn": {
      opacity: 0.72,
      transform: "translateY(4px) scale(0.92)",
    },
    "& .wishlist-remove-icon": {
      transform: "rotate(0deg)",
    },
    "&:hover .wishlist-remove-btn": {
      opacity: 1,
      transform: "translateY(0) scale(1)",
    },
    "&:hover .wishlist-remove-icon": {
      transform: "rotate(90deg)",
    },
  }),
  removeButton: css({
    ...font.medium12,
    position: "absolute",
    right: theme.s2,
    top: theme.s2,
    border: `1px solid ${color.semantics.error.red500}`,
    color: color.neutral0,
    background: color.semantics.error.red500,
    borderRadius: theme.br5,
    height: "30px",
    minWidth: "30px",
    padding: `0 ${theme.s2}`,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s1,
    zIndex: 3,
    boxShadow: theme.elevation.medium,
    transition:
      "transform 0.24s ease, opacity 0.24s ease, box-shadow 0.24s ease",
    "& .wishlist-remove-icon": {
      transition: "transform 0.24s ease",
    },
    "&:hover": {
      transform: "translateY(-1px)",
      opacity: 0.92,
      boxShadow: theme.elevation.large,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.65,
    },
  }),
  removeLabel: css({
    ...font.medium12,
    lineHeight: 1,
  }),
  info: css({
    ...font.regular14,
    color: color.neutral500,
    textAlign: "center",
    marginTop: theme.s10,
  }),
  noticeCard: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.br2,
    padding: theme.s6,
  }),
  noticeTitle: css({
    ...font.bold17,
    color: color.secondary500,
    margin: 0,
    marginBottom: theme.s2,
  }),
  noticeText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
}
