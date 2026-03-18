import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import * as LoginAction from "../Action/Login"
import * as AdminDashboardAction from "../Action/AdminDashboard"
import InputText from "../View/Form/InputText"
import { Category } from "../../../Core/App/Category"

export type Props = { state: State }

export default function AdminCategoryManagementPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const category = state.adminDashboard
  const deleteTarget = category.deleteCategoryTarget
  const deletingTarget =
    deleteTarget != null &&
    category.deletingCategoryIDs.includes(deleteTarget.id.unwrap())

  if (!isAdmin) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            This page is restricted to authenticated admin accounts.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminLogin", {})))}
          >
            Go to admin login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Titan Management</p>
          <h1 className={styles.title}>Category Management</h1>
          <p className={styles.subtitle}>
            Manage category structure as a tree, create from root or branch, and
            edit category names.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminDashboard", {})))}
          >
            Back to dashboard
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => emit(LoginAction.logout())}
          >
            Logout
          </button>
        </div>
      </header>

      <div
        className={`${styles.pageContent} ${
          deleteTarget != null ? styles.pageContentBlurred : ""
        }`}
      >
        {category.flashMessage != null ? (
          <div className={styles.flashCard}>
            <span>{category.flashMessage}</span>
            <button
              className={styles.flashDismiss}
              onClick={() => emit(AdminDashboardAction.clearFlashMessage())}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Create Root Category</h2>
            <InputText
              value={category.categoryRootName}
              invalid={false}
              type="text"
              placeholder="Example: Electronics"
              onChange={(value) =>
                emit(AdminDashboardAction.onChangeCategoryRootName(value))
              }
            />
            <button
              className={styles.secondaryButton}
              onClick={() =>
                emit(AdminDashboardAction.submitCreateRootCategory())
              }
              disabled={category.creatingCategoryResponse._t === "Loading"}
            >
              {category.creatingCategoryResponse._t === "Loading"
                ? "Creating..."
                : "Create root"}
            </button>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Create Child Category</h2>
            <span className={styles.fieldLabel}>Select Parent Category</span>
            <select
              className={styles.selectInput}
              value={category.categoryChildParentID?.unwrap() ?? ""}
              onChange={(event) => {
                const selectedId = event.currentTarget.value
                if (selectedId === "") {
                  emit(AdminDashboardAction.clearParentForChild())
                  return
                }

                const selectedParent = flattenCategories(
                  state.category.treeResponse._t === "Success"
                    ? state.category.treeResponse.data
                    : [],
                ).find((item) => item.id.unwrap() === selectedId)

                if (selectedParent != null) {
                  emit(
                    AdminDashboardAction.selectParentForChild(
                      selectedParent.id,
                      selectedParent.name.unwrap(),
                    ),
                  )
                }
              }}
            >
              <option value="">Choose parent category</option>
              {flattenCategories(
                state.category.treeResponse._t === "Success"
                  ? state.category.treeResponse.data
                  : [],
              ).map((item) => (
                <option
                  key={item.id.unwrap()}
                  value={item.id.unwrap()}
                >
                  {item.name.unwrap()}
                </option>
              ))}
            </select>
            <InputText
              value={category.categoryChildName}
              invalid={false}
              type="text"
              placeholder="Example: Smartphones"
              onChange={(value) =>
                emit(AdminDashboardAction.onChangeCategoryChildName(value))
              }
            />
            <div className={styles.row}>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  emit(AdminDashboardAction.submitCreateChildCategory())
                }
                disabled={category.creatingCategoryResponse._t === "Loading"}
              >
                {category.creatingCategoryResponse._t === "Loading"
                  ? "Creating..."
                  : "Create child"}
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => emit(AdminDashboardAction.clearParentForChild())}
              >
                Clear parent
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Edit Category</h2>
            <p className={styles.metaText}>
              Selected: {category.categoryEditID?.unwrap() ?? "None"}
            </p>
            <InputText
              value={category.categoryEditName}
              invalid={false}
              type="text"
              placeholder="New category name"
              onChange={(value) =>
                emit(AdminDashboardAction.onChangeEditCategoryName(value))
              }
            />
            <div className={styles.row}>
              <button
                className={styles.secondaryButton}
                onClick={() => emit(AdminDashboardAction.submitEditCategory())}
                disabled={category.updatingCategoryResponse._t === "Loading"}
              >
                {category.updatingCategoryResponse._t === "Loading"
                  ? "Updating..."
                  : "Update category"}
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => emit(AdminDashboardAction.cancelEditCategory())}
              >
                Cancel edit
              </button>
            </div>
          </article>
        </section>

        <section className={styles.treePanel}>
          <div className={styles.treeHeader}>
            <h2 className={styles.cardTitle}>Category Tree</h2>
            <button
              className={styles.secondaryButton}
              onClick={() => emit(AdminDashboardAction.reloadCategoryTree())}
            >
              Refresh
            </button>
          </div>

          {renderTree(state)}
        </section>
      </div>

      {deleteTarget != null ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Delete Category</h3>
            <p className={styles.modalText}>
              Delete category &quot;{deleteTarget.name}&quot;?
            </p>
            <p className={styles.modalText}>
              If this is a parent category, all child categories under it will
              also be deleted.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  emit(AdminDashboardAction.cancelDeleteCategory())
                }
                disabled={deletingTarget}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                onClick={() =>
                  emit(AdminDashboardAction.confirmDeleteCategory())
                }
                disabled={deletingTarget}
              >
                {deletingTarget ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function renderTree(state: State): JSX.Element {
  const treeResponse = state.category.treeResponse

  switch (treeResponse._t) {
    case "NotAsked":
      return <div className={styles.metaText}>No tree loaded yet.</div>
    case "Loading":
      return <div className={styles.metaText}>Loading categories...</div>
    case "Failure":
      return <div className={styles.metaText}>Failed to load categories.</div>
    case "Success":
      return (
        <div className={styles.treeRoot}>
          {treeResponse.data.length === 0 ? (
            <div className={styles.metaText}>No categories yet.</div>
          ) : (
            treeResponse.data.map((node) => (
              <CategoryNode
                key={node.id.unwrap()}
                category={node}
                state={state}
              />
            ))
          )}
        </div>
      )
  }
}

function CategoryNode(props: {
  category: Category
  state: State
}): JSX.Element {
  const { category } = props
  const { state } = props
  const isDeleting = state.adminDashboard.deletingCategoryIDs.includes(
    category.id.unwrap(),
  )

  return (
    <div className={styles.nodeWrap}>
      <div className={styles.nodeLine}>
        <span className={styles.nodeName}>{category.name.unwrap()}</span>
        <div className={styles.nodeActions}>
          <button
            className={styles.nodeActionButton}
            onClick={() =>
              emit(
                AdminDashboardAction.startEditCategory(
                  category.id,
                  category.name.unwrap(),
                ),
              )
            }
          >
            Edit
          </button>
          <button
            className={`${styles.nodeActionButton} ${styles.deleteActionButton}`}
            disabled={isDeleting}
            onClick={() =>
              emit(
                AdminDashboardAction.requestDeleteCategory(
                  category.id,
                  category.name.unwrap(),
                ),
              )
            }
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      {category.children.length > 0 ? (
        <div className={styles.childrenWrap}>
          {category.children.map((child) => (
            <CategoryNode
              key={child.id.unwrap()}
              category={child}
              state={state}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((item) => [
    item,
    ...flattenCategories(item.children),
  ])
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 15% 20%, ${color.secondary100} 0%, transparent 35%),` +
      `radial-gradient(circle at 80% 10%, ${color.secondary200} 0%, transparent 32%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
    display: "grid",
    gap: theme.s4,
    position: "relative",
  }),
  pageContent: css({
    display: "grid",
    gap: theme.s4,
    transition: "filter 180ms ease",
  }),
  pageContentBlurred: css({
    filter: "blur(4px)",
    pointerEvents: "none",
    userSelect: "none",
  }),
  hero: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    flexWrap: "wrap",
  }),
  heroActions: css({
    display: "flex",
    gap: theme.s2,
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: color.secondary500,
    marginBottom: theme.s1,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    maxWidth: "760px",
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.md({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    }),
  }),
  card: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s4,
    boxShadow: theme.elevation.medium,
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  treePanel: css({
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s4,
    boxShadow: theme.elevation.medium,
  }),
  treeHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s3,
  }),
  cardTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  row: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  metaText: css({
    ...font.regular12,
    color: color.neutral700,
    margin: 0,
  }),
  fieldLabel: css({
    ...font.medium12,
    color: color.neutral700,
  }),
  selectInput: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.neutral900,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  treeRoot: css({
    display: "grid",
    gap: theme.s2,
  }),
  nodeWrap: css({
    display: "grid",
    gap: theme.s1,
  }),
  nodeLine: css({
    border: `1px solid ${color.secondary100}`,
    background: color.secondary50,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s2}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  childrenWrap: css({
    marginLeft: theme.s4,
    borderLeft: `2px dashed ${color.secondary200}`,
    paddingLeft: theme.s2,
    display: "grid",
    gap: theme.s1,
  }),
  nodeName: css({
    ...font.medium14,
    color: color.neutral900,
  }),
  nodeActions: css({
    display: "flex",
    gap: theme.s1,
  }),
  nodeActionButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s2}`,
    ...font.medium12,
    cursor: "pointer",
  }),
  deleteActionButton: css({
    borderColor: color.semantics.error.red500,
    color: color.semantics.error.red500,
  }),
  modalBackdrop: css({
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.s4,
    zIndex: 1200,
  }),
  modalCard: css({
    width: "100%",
    maxWidth: "520px",
    borderRadius: theme.s4,
    border: `1px solid ${color.secondary200}`,
    background: color.neutral0,
    boxShadow: theme.elevation.large,
    padding: theme.s5,
    display: "grid",
    gap: theme.s2,
  }),
  modalTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  modalText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
  modalActions: css({
    marginTop: theme.s2,
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.s2,
  }),
  dangerButton: css({
    border: "none",
    background: color.semantics.error.red500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    ":disabled": {
      opacity: 0.65,
      cursor: "not-allowed",
    },
  }),
  primaryButton: css({
    border: "none",
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  secondaryButton: css({
    border: `1px solid ${color.secondary300}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
  }),
  ghostButton: css({
    border: "none",
    background: "transparent",
    color: color.secondary500,
    textDecoration: "underline",
    ...font.medium12,
    cursor: "pointer",
  }),
  flashCard: css({
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary50,
    padding: `${theme.s2} ${theme.s3}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...font.medium14,
    color: color.neutral800,
  }),
  flashDismiss: css({
    border: "none",
    background: "none",
    textDecoration: "underline",
    color: color.secondary500,
    ...font.medium12,
    cursor: "pointer",
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: color.neutral100,
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "520px",
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    padding: theme.s6,
    boxShadow: theme.elevation.large,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    alignItems: "flex-start",
  }),
  gateTitle: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
}
