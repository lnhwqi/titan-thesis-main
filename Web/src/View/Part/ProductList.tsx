import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { Category } from "../../../../Core/App/Category"
import { color, font, theme } from "../Theme"
import { ProductCard } from "./ProductCard"
import { emit } from "../../Runtime/React"
import * as ProductAction from "../../Action/Product"
import type { SortByOption } from "../../../../Core/Api/Public/Product/ListAll"
import { fadeSlideUp } from "../Theme/Keyframe"

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
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={styles.skeletonCard}
              >
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonBody}>
                  <div
                    className={styles.skeletonLine}
                    style={{ width: "40%", height: "10px" }}
                  />
                  <div
                    className={styles.skeletonLine}
                    style={{ width: "85%", height: "14px" }}
                  />
                  <div
                    className={styles.skeletonLine}
                    style={{ width: "55%", height: "14px" }}
                  />
                  <div
                    className={styles.skeletonLine}
                    style={{ width: "50%", height: "16px" }}
                  />
                </div>
              </div>
            ))}
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
    animation: `${fadeSlideUp} 0.35s ease both`,
  }),

  header: css({
    marginBottom: theme.s6,
    position: "relative",
  }),

  title: css({
    ...font.boldH3_29,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: theme.s3,
    letterSpacing: "-0.5px",
    display: "inline-block",
  }),

  divider: css({
    width: "64px",
    height: "4px",
    background: color.genz.gradientPurplePink,
    borderRadius: theme.brFull,
    position: "relative",
    overflow: "hidden",
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmerDiv 2s linear infinite",
    },
    "@keyframes shimmerDiv": {
      from: { backgroundPosition: "200% center" },
      to: { backgroundPosition: "-200% center" },
    },
  }),

  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
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
    padding: `${theme.s10} ${theme.s6}`,
    background: "rgba(124,58,237,0.03)",
    borderRadius: theme.br3,
    border: `1px dashed rgba(124,58,237,0.15)`,
  }),

  errorBox: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.s10,
    background: "rgba(124, 58, 237, 0.05)",
    border: `1px solid rgba(124, 58, 237, 0.15)`,
    borderRadius: theme.br3,
    color: color.genz.purple,
    gap: theme.s2,
    ...font.medium14,
  }),

  spinner: css({
    width: "32px",
    height: "32px",
    border: `3px solid rgba(124, 58, 237, 0.15)`,
    borderTopColor: color.genz.purple,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    "@keyframes spin": {
      to: { transform: "rotate(360deg)" },
    },
  }),

  skeletonGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
    gap: theme.s4,
    paddingBottom: theme.s10,
  }),

  skeletonCard: css({
    borderRadius: theme.br3,
    overflow: "hidden",
    border: `1.5px solid rgba(124, 58, 237, 0.08)`,
    backgroundColor: color.neutral0,
  }),

  skeletonImage: css({
    width: "100%",
    paddingTop: "100%",
    background: `linear-gradient(90deg, rgba(124,58,237,0.06) 25%, rgba(236,72,153,0.04) 50%, rgba(124,58,237,0.06) 75%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite linear",
    "@keyframes shimmer": {
      to: { backgroundPosition: "-200% 0" },
    },
  }),

  skeletonBody: css({
    padding: theme.s3,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),

  skeletonLine: css({
    borderRadius: "4px",
    background: `linear-gradient(90deg, rgba(124,58,237,0.07) 25%, rgba(236,72,153,0.04) 50%, rgba(124,58,237,0.07) 75%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite linear",
  }),

  controlsSection: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s5,
    padding: `${theme.s3} ${theme.s4}`,
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(12px)",
    borderRadius: theme.br3,
    border: `1px solid rgba(124, 58, 237, 0.12)`,
    boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
    gap: theme.s3,
  }),

  sortControl: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),

  label: css({
    ...font.bold12,
    color: color.genz.purple,
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
  }),

  select: css({
    padding: `${theme.s1} ${theme.s3}`,
    border: `1.5px solid rgba(124, 58, 237, 0.25)`,
    borderRadius: "20px",
    backgroundColor: color.neutral0,
    color: color.genz.purple,
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
    "&:hover": {
      borderColor: color.genz.purple,
      boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.1)",
    },
    "&:focus": {
      borderColor: color.genz.pink,
      boxShadow: "0 0 0 3px rgba(236, 72, 153, 0.12)",
    },
  }),

  paginationInfo: css({
    ...font.regular12,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
    fontWeight: 600,
  }),

  paginationControls: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s2,
    marginTop: theme.s6,
    paddingTop: theme.s4,
    borderTop: `1px solid rgba(124, 58, 237, 0.08)`,
  }),

  paginationButton: css({
    padding: `${theme.s2} ${theme.s5}`,
    border: `1.5px solid rgba(124, 58, 237, 0.3)`,
    borderRadius: "20px",
    backgroundColor: color.neutral0,
    color: color.genz.purple,
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover:not(:disabled)": {
      background: color.genz.gradientPurplePink,
      color: color.neutral0,
      borderColor: "transparent",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
    },
    "&:disabled": {
      borderColor: color.neutral200,
      color: color.neutral300,
      cursor: "not-allowed",
      opacity: 0.5,
    },
  }),

  pageNumbers: css({
    display: "flex",
    gap: theme.s1,
  }),

  pageButton: css({
    width: "34px",
    height: "34px",
    border: `1px solid rgba(124, 58, 237, 0.15)`,
    borderRadius: "50%",
    backgroundColor: color.neutral0,
    color: color.genz.purple,
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: color.genz.purple,
      background: "rgba(124, 58, 237, 0.07)",
      transform: "scale(1.1)",
    },
  }),

  pageButtonActive: css({
    background: color.genz.gradientPurplePink,
    borderColor: "transparent",
    color: color.neutral0,
    boxShadow: "0 2px 10px rgba(124, 58, 237, 0.4)",
    "&:hover": {
      background: color.genz.gradientPurplePink,
      borderColor: "transparent",
      color: color.neutral0,
      transform: "scale(1.1)",
    },
  }),
}

