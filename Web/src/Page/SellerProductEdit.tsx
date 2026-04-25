import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as SellerDashboardAction from "../Action/SellerDashboard"
import { navigateTo, toRoute } from "../Route"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import * as AuthToken from "../App/AuthToken"
import { Category } from "../../../Core/App/Category"

type Props = { state: State }

type CategoryOption = {
  id: string
  label: string
}

export default function SellerProductEditPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return <div className={styles.page}>Seller access required.</div>
  }

  const edit = state.sellerDashboard
  const categoryOptions =
    state.category.treeResponse._t === "Success"
      ? toCategoryOptions(state.category.treeResponse.data)
      : []

  return (
    <div className={styles.page}>
      {edit.updateProductResponse._t === "Success" ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Changes Saved</h2>
            <p className={styles.modalText}>
              Product information has been updated successfully.
            </p>
            <button
              className={styles.modalButton}
              onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Product</h1>
          <p className={styles.subtitle}>
            Update product name, description, sku, stock, image URLs and
            category.
          </p>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
        >
          Back to Dashboard
        </button>
      </header>

      <section className={styles.panel}>
        {edit.flashMessage != null ? (
          <div className={styles.flash}>{edit.flashMessage}</div>
        ) : null}

        {edit.isLoadingEditProduct ? (
          <div className={styles.loading}>Loading product...</div>
        ) : (
          <>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.label}>Product Name</span>
                <InputText
                  value={edit.editName}
                  invalid={false}
                  type="text"
                  onChange={(v) =>
                    emit(SellerDashboardAction.onChangeEditName(v))
                  }
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Category</span>
                <select
                  className={styles.select}
                  value={edit.editCategoryID}
                  onChange={(e) =>
                    emit(
                      SellerDashboardAction.onChangeEditCategoryID(
                        e.currentTarget.value,
                      ),
                    )
                  }
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Price</span>
                <InputText
                  value={edit.editPrice}
                  invalid={false}
                  type="number"
                  onChange={(v) =>
                    emit(SellerDashboardAction.onChangeEditPrice(v))
                  }
                />
              </div>

              <div className={styles.fieldFull}>
                <span className={styles.label}>Description</span>
                <InputText
                  value={edit.editDescription}
                  invalid={false}
                  type="text"
                  onChange={(v) =>
                    emit(SellerDashboardAction.onChangeEditDescription(v))
                  }
                />
              </div>

              <div className={styles.fieldFull}>
                <span className={styles.label}>Variants</span>
                <div className={styles.variantList}>
                  {edit.editVariants.map((variant, index) => (
                    <div
                      key={variant.id ?? String(index)}
                      className={styles.variantCard}
                    >
                      <InputText
                        value={variant.name}
                        invalid={false}
                        type="text"
                        placeholder="Variant name"
                        onChange={(v) =>
                          emit(
                            SellerDashboardAction.onChangeEditVariant(
                              index,
                              "name",
                              v,
                            ),
                          )
                        }
                      />
                      <InputText
                        value={variant.sku}
                        invalid={false}
                        type="text"
                        placeholder="SKU"
                        onChange={(v) =>
                          emit(
                            SellerDashboardAction.onChangeEditVariant(
                              index,
                              "sku",
                              v,
                            ),
                          )
                        }
                      />
                      <InputText
                        value={variant.stock}
                        invalid={false}
                        type="number"
                        placeholder="Stock"
                        onChange={(v) =>
                          emit(
                            SellerDashboardAction.onChangeEditVariant(
                              index,
                              "stock",
                              v,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.fieldFull}>
                <span className={styles.label}>Images</span>
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    if (typeof document !== "undefined") {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.multiple = true
                      input.onchange = () => {
                        const files = Array.from(input.files ?? [])
                        if (files.length > 0) {
                          emit(
                            SellerDashboardAction.uploadEditProductImages(
                              files,
                            ),
                          )
                        }
                      }
                      input.click()
                    }
                  }}
                >
                  {edit.isUploadingImages ? "Uploading..." : "Upload Images"}
                </button>
                <div className={styles.imageList}>
                  {edit.editImageUrls.map((url) => (
                    <div
                      key={url}
                      className={styles.imageRow}
                    >
                      <span className={styles.imageText}>{url}</span>
                      <button
                        className={styles.deleteButton}
                        onClick={() =>
                          emit(SellerDashboardAction.removeEditImageUrl(url))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                theme_={"Red"}
                size={"M"}
                label={
                  edit.updateProductResponse._t === "Loading"
                    ? "Saving..."
                    : "Save Changes"
                }
                onClick={() =>
                  emit(SellerDashboardAction.submitEditProductFromPage())
                }
                disabled={edit.updateProductResponse._t === "Loading"}
              />
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function toCategoryOptions(
  categories: Category[],
  parents: string[] = [],
): CategoryOption[] {
  return categories.flatMap((item) => {
    const path = [...parents, item.name.unwrap()]

    return [
      { id: item.id.unwrap(), label: path.join(" - ") },
      ...toCategoryOptions(item.children, path),
    ]
  })
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%), ` +
      `radial-gradient(circle at 85% 80%, ${color.genz.pink100} 0%, transparent 30%), ` +
      `${color.neutral0}`,
    position: "relative",
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  modalOverlay: css({
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: theme.s4,
  }),
  modalCard: css({
    width: "100%",
    maxWidth: "420px",
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.large,
    padding: theme.s5,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    textAlign: "center",
  }),
  modalTitle: css({
    ...font.boldH4_24,
    margin: 0,
    color: color.genz.purple,
  }),
  modalText: css({
    ...font.regular14,
    margin: 0,
    color: color.neutral700,
  }),
  modalButton: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s3,
    marginBottom: theme.s4,
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s1,
  }),
  panel: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
  }),
  flash: css({
    ...font.medium14,
    color: color.genz.purple,
    marginBottom: theme.s3,
  }),
  loading: css({
    ...font.regular14,
    color: color.neutral700,
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  fieldFull: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    ...bp.md({
      gridColumn: "1 / span 2",
    }),
  }),
  label: css({
    ...font.medium14,
    color: color.neutral700,
  }),
  select: css({
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  variantList: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s2,
  }),
  variantCard: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    background: color.neutral50,
    display: "grid",
    gap: theme.s1,
  }),
  imageList: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  imageRow: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s2}`,
  }),
  imageText: css({
    ...font.regular12,
    color: color.neutral700,
    wordBreak: "break-all",
  }),
  actions: css({
    marginTop: theme.s4,
    display: "flex",
    justifyContent: "flex-end",
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  deleteButton: css({
    border: `1px solid ${color.semantics.error.red500}`,
    background: color.semantics.error.red50,
    color: color.semantics.error.red500,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s2}`,
    ...font.medium12,
    cursor: "pointer",
  }),
}
