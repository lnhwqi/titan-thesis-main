import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { bp, color, font, theme } from "../View/Theme"
import { fadeSlideUp } from "../View/Theme/Keyframe"
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
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Seller Access Required</h1>
          <p className={styles.gateText}>
            Please log in as a seller to edit products.
          </p>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("SellerLogin", {})))}
          >
            Go to Seller Login
          </button>
        </div>
      </div>
    )
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

      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Seller Workspace</p>
          <h1 className={styles.heroTitle}>Edit Product</h1>
          <p className={styles.heroSubtitle}>
            Update product name, description, sku, stock, image URLs and
            category.
          </p>
        </div>
        <button
          className={styles.heroSecondaryButton}
          onClick={() => emit(navigateTo(toRoute("SellerDashboard", {})))}
        >
          ← Dashboard
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
                        value={variant.price}
                        invalid={false}
                        type="number"
                        placeholder="Price"
                        onChange={(v) =>
                          emit(
                            SellerDashboardAction.onChangeEditVariant(
                              index,
                              "price",
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
      `${color.secondary10}`,
    position: "relative",
    display: "grid",
    gap: theme.s5,
    alignContent: "start",
    animation: `${fadeSlideUp} 0.4s ease both`,
    ...bp.md({
      padding: `${theme.s8} ${theme.s10}`,
    }),
  }),
  gateContainer: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s6,
    background: `radial-gradient(circle at 10% 15%, rgba(0, 82, 156, 0.08) 0%, transparent 40%), ${color.secondary10}`,
  }),
  gateCard: css({
    maxWidth: "min(100%, 420px)",
    background: "var(--app-surface-strong)",
    border: "1px solid var(--app-border)",
    borderRadius: theme.s4,
    boxShadow: "var(--app-shadow-lg)",
    padding: theme.s6,
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    textAlign: "center",
  }),
  gateTitle: css({ ...font.boldH4_24, margin: 0, color: "var(--app-accent)" }),
  gateText: css({ ...font.regular14, margin: 0, color: color.neutral600 }),
  hero: css({
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.secondary400} 38%, ${color.primary400} 100%)`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: "0 16px 36px rgba(0, 82, 156, 0.24)",
    color: color.neutral0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s3,
    flexWrap: "wrap",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.14) 0%, transparent 50%)",
      pointerEvents: "none",
    },
  }),
  kicker: css({
    ...font.bold12,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: color.secondary50,
    marginBottom: theme.s1,
  }),
  heroTitle: css({ ...font.boldH4_24, margin: 0, color: color.neutral0 }),
  heroSubtitle: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.75)",
    marginTop: theme.s1,
  }),
  heroSecondaryButton: css({
    border: `1px solid rgba(255,255,255,0.25)`,
    background: "rgba(255,255,255,0.1)",
    color: color.neutral0,
    borderRadius: theme.br5,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "rgba(255,255,255,0.18)",
      transform: "translateY(-2px)",
    },
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
    maxWidth: "min(100%, 420px)",
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
