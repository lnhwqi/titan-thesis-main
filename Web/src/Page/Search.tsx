import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
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
    padding: theme.s4,
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  }),
  title: css({
    ...font.bold17,
    marginBottom: theme.s6,
    color: color.neutral900,
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: theme.s4,
  }),
  loading: css({
    textAlign: "center",
    padding: theme.s10,
    color: color.neutral600,
  }),
  error: css({
    textAlign: "center",
    color: color.semantics.error.red500,
  }),
  emptyState: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.s10,
    backgroundColor: color.neutral50,
    borderRadius: theme.br2,
  }),
  icon: css({ fontSize: "48px", marginBottom: theme.s4 }),
  text: css({ ...font.bold17, color: color.neutral800 }),
  subText: css({ ...font.regular14, color: color.neutral500 }),
}
