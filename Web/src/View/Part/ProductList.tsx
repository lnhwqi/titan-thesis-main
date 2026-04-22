import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { Category } from "../../../../Core/App/Category"
import { color, font, theme } from "../Theme"
import { ProductCard } from "./ProductCard"
import { emit } from "../../Runtime/React"
import * as ProductAction from "../../Action/Product"
import type { SortByOption } from "../../../../Core/Api/Public/Product/ListAll"

function toSortByOption(value: string): SortByOption | null {
  switch (value) {
    case "price-low":
    case "price-high":
    case "newest":
    case "oldest":
      return value
    default:
      return null
  }
}

type Props = {
  state: State
}

export default function MainContent(props: Props): JSX.Element {
  const { listResponse, currentCategoryId } = props.state.product
  const categoryName = getSelectedCategoryName(props.state)

  const renderHeader = () => (
    <div className={styles.header}>
      <h1 className={styles.title}>
        {currentCategoryId
          ? (categoryName ?? "Category Products")
          : "All Products"}
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
      const totalCount = listResponse.data.totalCount ?? 0
      const currentPage = props.state.product.listPage
      const limit = listResponse.data.limit ?? 12
      const sortBy = props.state.product.listSortBy
      const totalPages = Math.ceil(totalCount / limit)

      return (
        <div className={styles.container}>
          {renderHeader()}

          {/* Filter and Pagination Controls */}
          <div className={styles.controlsSection}>
            <div className={styles.sortControl}>
              <label className={styles.label}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  const sortByOption = toSortByOption(e.target.value)
                  if (sortByOption !== null) {
                    emit(ProductAction.changeSortBy(sortByOption))
                  }
                }}
                className={styles.select}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className={styles.paginationInfo}>
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalCount)} of {totalCount} items
            </div>
          </div>

          {products.length === 0 ? (
            <div className={styles.infoText}>
              No products found in this category.
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id.unwrap()}
                    product={product}
                    state={props.state}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationButton}
                    onClick={() =>
                      emit(ProductAction.changeListPage(currentPage - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`${styles.pageButton} ${
                            page === currentPage ? styles.pageButtonActive : ""
                          }`}
                          onClick={() =>
                            emit(ProductAction.changeListPage(page))
                          }
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    className={styles.paginationButton}
                    onClick={() =>
                      emit(ProductAction.changeListPage(currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )
  }
}

function getSelectedCategoryName(state: State): string | null {
  const currentCategoryId = state.product.currentCategoryId
  if (currentCategoryId == null) {
    return null
  }

  const selectedId = currentCategoryId.unwrap()

  if (state.product.currentCategoryTree != null) {
    const fromCurrentTree = findCategoryByID(
      [state.product.currentCategoryTree],
      selectedId,
    )
    if (fromCurrentTree != null) {
      return fromCurrentTree.name.unwrap()
    }
  }

  if (state.category.treeResponse._t !== "Success") {
    return null
  }

  const fromRootTree = findCategoryByID(
    state.category.treeResponse.data,
    selectedId,
  )
  return fromRootTree == null ? null : fromRootTree.name.unwrap()
}

function findCategoryByID(
  categories: Category[],
  categoryID: string,
): Category | null {
  for (const category of categories) {
    if (category.id.unwrap() === categoryID) {
      return category
    }

    const found = findCategoryByID(category.children, categoryID)
    if (found != null) {
      return found
    }
  }

  return null
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
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 220px))",
    justifyContent: "start",
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

  controlsSection: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s4,
    padding: theme.s3,
    backgroundColor: color.neutral50,
    borderRadius: theme.br2,
    gap: theme.s3,
  }),

  sortControl: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),

  label: css({
    ...font.bold12,
    color: color.neutral800,
    whiteSpace: "nowrap",
  }),

  select: css({
    padding: `${theme.s1} ${theme.s2}`,
    border: `1px solid ${color.neutral300}`,
    borderRadius: theme.br1,
    backgroundColor: color.neutral0,
    color: color.neutral800,
    fontSize: "14px",
    cursor: "pointer",
    "&:hover": {
      borderColor: color.secondary500,
    },
  }),

  paginationInfo: css({
    ...font.regular12,
    color: color.neutral600,
    whiteSpace: "nowrap",
  }),

  paginationControls: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s2,
    marginTop: theme.s6,
    paddingTop: theme.s4,
    borderTop: `1px solid ${color.neutral200}`,
  }),

  paginationButton: css({
    padding: `${theme.s2} ${theme.s3}`,
    border: `1px solid ${color.secondary500}`,
    borderRadius: theme.br1,
    backgroundColor: color.neutral0,
    color: color.secondary500,
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover:not(:disabled)": {
      backgroundColor: color.secondary500,
      color: color.neutral0,
    },
    "&:disabled": {
      borderColor: color.neutral300,
      color: color.neutral400,
      cursor: "not-allowed",
      opacity: 0.5,
    },
  }),

  pageNumbers: css({
    display: "flex",
    gap: theme.s1,
  }),

  pageButton: css({
    width: "36px",
    height: "36px",
    border: `1px solid ${color.neutral300}`,
    borderRadius: theme.br1,
    backgroundColor: color.neutral0,
    color: color.neutral800,
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: color.secondary500,
      color: color.secondary500,
    },
  }),

  pageButtonActive: css({
    backgroundColor: color.secondary500,
    borderColor: color.secondary500,
    color: color.neutral0,
  }),
}
