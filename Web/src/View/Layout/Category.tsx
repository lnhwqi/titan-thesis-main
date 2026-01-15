import { JSX } from "react"
import { css, cx } from "@emotion/css"
import { State } from "../../State"
import { color, font, theme } from "../../View/Theme"
import { emit } from "../../Runtime/React"
import { RemoteData } from "../../../../Core/Data/RemoteData"
import { ApiError } from "../../Api"
import * as CategoryListApi from "../../Api/Public/Category/ListAll"
import * as CategoryAction from "../../Action/Category"
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
          <div
            className={cx(styles.item, {
              [styles.itemActive]: state.product.currentCategoryId === null,
            })}
            onClick={() => {}}
          >
            All Products
          </div>

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
  const isSelected = state.product.currentCategoryId === category.id

  return (
    <div
      key={category.id.unwrap()}
      className={styles.nodeWrapper}
    >
      <div
        className={cx(styles.item, {
          [styles.itemActive]: isSelected,
        })}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={(e) => {
          e.stopPropagation()
          CategoryAction.selectCategory(emit, state, category.id)
        }}
      >
        {category.name.unwrap()}
      </div>

      {category.children.length > 0 && (
        <div className={styles.childrenContainer}>
          {category.children.map((child: Category) =>
            renderCategoryItem(state, child, depth + 1),
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: css({
    width: "250px",
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${color.neutral200}`,
    backgroundColor: color.neutral50,
    height: "100%",
    overflowY: "auto",
  }),
  title: css({
    padding: `${theme.s4} ${theme.s3}`,
    ...font.bold14,
    borderBottom: `1px solid ${color.neutral200}`,
    color: color.neutral900,
  }),
  loading: css({
    padding: theme.s4,
    ...font.regular14,
    color: color.neutral500,
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
      backgroundColor: color.primary50,
      color: color.primary400,
    },
  }),
  itemActive: css({
    backgroundColor: color.primary100,
    color: color.primary500,
    fontWeight: 600,
    borderRight: `3px solid ${color.primary500}`,
  }),
  childrenContainer: css({
    display: "flex",
    flexDirection: "column",
  }),
}
