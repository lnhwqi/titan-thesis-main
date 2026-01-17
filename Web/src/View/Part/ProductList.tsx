import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { color, font, theme } from "../Theme"
import { ProductCard } from "./ProductCard"

type Props = {
  state: State
}

export default function MainContent(props: Props): JSX.Element {
  const { listResponse, currentCategoryId } = props.state.product

  const renderHeader = () => (
    <div className={styles.header}>
      <h1 className={styles.title}>
        {currentCategoryId ? "Category Products" : "All Products"}
      </h1>
      <div className={styles.divider} />
    </div>
  )

  switch (listResponse._t) {
    case "NotAsked":
      return <></>
    case "Loading":
      return (
        <div className={styles.container}>
          {renderHeader()}
          <div className={styles.centerBox}>
            <div className={styles.spinner} />
            <p className={styles.infoText}>Fetching products...</p>
          </div>
        </div>
      )

    case "Failure":
      return (
        <div className={styles.container}>
          {renderHeader()}
          <div className={styles.errorBox}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <p>Unable to load products. Please check your connection.</p>
          </div>
        </div>
      )

    case "Success":
      const products = listResponse.data.items

      return (
        <div className={styles.container}>
          {renderHeader()}
          {products.length === 0 ? (
            <div className={styles.infoText}>
              No products found in this category.
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id.unwrap()}
                  product={product}
                  state={props.state}
                />
              ))}
            </div>
          )}
        </div>
      )
  }
}

const styles = {
  container: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: color.neutral0,
    padding: theme.s6,
    height: "100%",
    overflowY: "auto",
  }),

  header: css({
    marginBottom: theme.s6,
  }),

  title: css({
    ...font.bold17,
    color: color.secondary500,
    marginBottom: theme.s2,
  }),

  divider: css({
    width: "40px",
    height: "3px",
    backgroundColor: color.secondary500,
    borderRadius: theme.br1,
  }),

  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: theme.s4,
    paddingBottom: theme.s10,
  }),

  centerBox: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: theme.s3,
  }),

  infoText: css({
    ...font.regular14,
    color: color.neutral500,
    textAlign: "center",
    marginTop: theme.s10,
  }),

  errorBox: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.s10,
    backgroundColor: color.secondary100,
    borderRadius: theme.br2,
    color: color.primary500,
    gap: theme.s2,
    ...font.medium14,
  }),

  spinner: css({
    width: "32px",
    height: "32px",
    border: `3px solid ${color.neutral200}`,
    borderTopColor: color.secondary500,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    "@keyframes spin": {
      to: { transform: "rotate(360deg)" },
    },
  }),
}
