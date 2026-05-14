import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { font, theme } from "../View/Theme"
import { ProductCard } from "../View/Part/ProductCard"

type Props = { state: State }

export default function SearchPage(props: Props): JSX.Element {
  const { listResponse, searchQuery } = props.state.product

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{`Search results for ${searchQuery}`}</h1>

      {(() => {
        switch (listResponse._t) {
          case "NotAsked":
          case "Loading":
            return <div className={styles.loading}>Searching...</div>

          case "Failure":
            if (
              listResponse.error === "PRODUCT_NOT_FOUND" ||
              listResponse.error === "NO_PRODUCTS_FOUND"
            ) {
              return (
                <div className={styles.emptyState}>
                  <div className={styles.icon}>🔍</div>
                  <div className={styles.text}>No products found.</div>
                  <div className={styles.subText}>Try different keywords.</div>
                </div>
              )
            }
            return <div className={styles.error}>Something went wrong.</div>

          case "Success":
            const products = listResponse.data.items
            if (products.length === 0) {
              return <div className={styles.emptyState}>No products found.</div>
            }

            return (
              <div className={styles.grid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id.unwrap()}
                    product={product}
                    state={props.state}
                  />
                ))}
              </div>
            )
        }
      })()}
    </div>
  )
}

const styles = {
  container: css({
    padding: `clamp(12px, 2.5vw, 24px)`,
    width: "100%",
    maxWidth: "min(100%, 1200px)",
    margin: "0 auto",
  }),
  title: css({
    ...font.bold17,
    marginBottom: theme.s6,
    color: "var(--app-text)",
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
    justifyContent: "stretch",
    gap: theme.s4,
  }),
  loading: css({
    textAlign: "center",
    padding: theme.s10,
    color: "var(--app-text-soft)",
  }),
  error: css({
    textAlign: "center",
    color: "var(--app-error-500)",
  }),
  emptyState: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.s10,
    backgroundColor: "var(--app-surface)",
    borderRadius: theme.br2,
    border: "1px solid var(--app-border)",
  }),
  icon: css({ fontSize: "48px", marginBottom: theme.s4 }),
  text: css({ ...font.bold17, color: "var(--app-text)" }),
  subText: css({ ...font.regular14, color: "var(--app-text-soft)" }),
}
