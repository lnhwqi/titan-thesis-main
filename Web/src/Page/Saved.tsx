import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { ProductCard } from "../View/Part/ProductCard"
import {
  AuthPageShell,
  AuthPageHeader,
  AuthPageCard,
  AuthGateCard,
} from "../View/Part/AuthPageShell"

export type SavedPageProps = { state: State }

export default function SavedPage(props: SavedPageProps): JSX.Element {
  const { state } = props

  if (!("updateProfile" in state)) {
    return (
      <AuthPageShell>
        <AuthGateCard
          title="Saved Products"
          message="Please login to access your wishlist."
          loginRedirect="/saved"
        />
      </AuthPageShell>
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
    <AuthPageShell>
      <AuthPageHeader
        title="Saved Products"
        subtitle={`${savedProducts.length} item${savedProducts.length === 1 ? "" : "s"}`}
      />
      <AuthPageCard>
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
      </AuthPageCard>
    </AuthPageShell>
  )
}

const styles = {
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 220px))",
    justifyContent: "start",
    gap: theme.s4,
    paddingBottom: theme.s4,
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
    padding: `${theme.s10} 0`,
  }),
}
