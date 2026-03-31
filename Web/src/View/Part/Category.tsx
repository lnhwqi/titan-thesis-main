import { JSX } from "react"
import { css, cx } from "@emotion/css"
import { State } from "../../State"
import { color, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import { RemoteData } from "../../../../Core/Data/RemoteData"
import { ApiError } from "../../Api"
import * as CategoryListApi from "../../Api/Public/Category/ListAll"
// import * as CategoryAction from "../../Action/Category"
import * as ProductAction from "../../Action/Product"
import { Category } from "../../../../Core/App/Category"

export type Props = { state: State }

export default function CategorySidebar(props: Props): JSX.Element {
  const { treeResponse } = props.state.category

  return (
    <div className={styles.container}>
      <div className={styles.title}>Categories</div>
      {renderContent(props.state, treeResponse)}
    </div>
  )
}

function renderContent(
  state: State,
  response: RemoteData<
    ApiError<CategoryListApi.ErrorCode>,
    CategoryListApi.Payload
  >,
): JSX.Element | null {
  switch (response._t) {
    case "NotAsked":
    case "Loading":
      return <div className={styles.loading}>Loading categories...</div>

    case "Failure":
      return <div className={styles.error}>Failed to load categories.</div>

    case "Success":
      return (
        <div className={styles.list}>
          {response.data.map((cat: Category) =>
            renderCategoryItem(state, cat, 0),
          )}
        </div>
      )
  }
}
function renderCategoryItem(
  state: State,
  category: Category,
  depth: number,
): JSX.Element {
  const { currentCategoryId } = state.product

  const categoryIdStr = category.id.unwrap()
  const currentIdStr = currentCategoryId?.unwrap()

  const isSelected =
    currentIdStr !== undefined && currentIdStr === categoryIdStr

  const isOpen = isSelected || isCategoryOpen(category, currentIdStr)

  const children = isOpen && category.children ? category.children : []

  return (
    <div
      key={categoryIdStr}
      className={styles.nodeWrapper}
    >
      <div
        className={cx(styles.item, { [styles.itemActive]: isSelected })}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={(e) => {
          e.stopPropagation()
          emit(ProductAction.selectCategory(category.id))
        }}
      >
        {category.name.unwrap()}
      </div>

      {isOpen && children.length > 0 && (
        <div className={styles.childrenContainer}>
          {children.map((child: Category) =>
            renderCategoryItem(state, child, depth + 1),
          )}
        </div>
      )}
    </div>
  )
}

// ======== Helers ========
function isCategoryOpen(category: Category, selectedId?: string): boolean {
  if (!selectedId) return false
  if (category.id.unwrap() === selectedId) return true
  return category.children.some((child) => isCategoryOpen(child, selectedId))
}
const styles = {
  container: css({
    width: "250px",
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${color.neutral200}`,
    backgroundColor: color.neutral0,
    height: "100%",
    overflowY: "auto",
  }),
  title: css({
    padding: `${theme.s4} ${theme.s3}`,
    ...font.bold14,
    borderBottom: `1px solid ${color.neutral200}`,
    color: color.secondary500,
  }),
  loading: css({
    padding: theme.s4,
    ...font.regular14,
    color: color.secondary500,
    textAlign: "center",
  }),
  error: css({
    padding: theme.s4,
    ...font.regular14,
    color: color.semantics.error.red500,
  }),
  list: css({
    display: "flex",
    flexDirection: "column",
    padding: `${theme.s2} 0`,
  }),
  nodeWrapper: css({
    display: "flex",
    flexDirection: "column",
  }),
  item: css({
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    color: color.neutral700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: color.secondary300,
      color: color.neutral0,
    },
  }),
  itemActive: css({
    backgroundColor: color.secondary300,
    color: color.neutral0,
    fontWeight: 600,
    borderRight: `3px solid ${color.secondary500}`,
  }),
  childrenContainer: css({
    display: "flex",
    flexDirection: "column",
  }),
}
