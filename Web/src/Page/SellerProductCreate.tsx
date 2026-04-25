import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import { emit } from "../Runtime/React"
import * as SellerDashboardAction from "../Action/SellerDashboard"
import { navigateTo, toRoute } from "../Route"
import * as AuthToken from "../App/AuthToken"
import { Category } from "../../../Core/App/Category"

type Props = { state: State }

type CategoryOption = {
  id: string
  label: string
}

const variantSizes: Array<"S" | "M" | "L" | "XL"> = ["S", "M", "L", "XL"]
const variantModeOptions: Array<{
  value: "PRESET" | "NONE" | "CUSTOM"
  label: string
}> = [
  { value: "PRESET", label: "Preset (S/M/L/XL)" },
  { value: "NONE", label: "No size" },
  { value: "CUSTOM", label: "Custom variants" },
]

export default function SellerProductCreatePage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isSeller = auth != null && auth.role === "SELLER"

  if (!isSeller) {
    return (
      <div className={styles.gate}>
        <p className={styles.muted}>Seller access required.</p>
      </div>
    )
  }

  const createState = state.sellerDashboard
  const categoryOptions =
    state.category.treeResponse._t === "Success"
      ? toCategoryOptions(state.category.treeResponse.data)
      : []

  return (
    <div className={styles.page}>
      {createState.flashMessage != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Notice</h2>
            <p className={styles.modalText}>{createState.flashMessage}</p>
            <button
              className={styles.modalButton}
              onClick={() => emit(SellerDashboardAction.clearFlashMessage())}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Create Product</h1>
          <p className={styles.subtitle}>
            Create a new product from this page.
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
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Product Name</span>
            <InputText
              value={createState.name}
              invalid={false}
              type="text"
              placeholder="Product name"
              onChange={(v) => emit(SellerDashboardAction.onChangeName(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <select
              className={styles.select}
              value={createState.categoryID}
              onChange={(e) =>
                emit(
                  SellerDashboardAction.onChangeCategoryID(
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
              value={createState.price}
              invalid={false}
              type="number"
              placeholder="100000"
              onChange={(v) => emit(SellerDashboardAction.onChangePrice(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Base SKU</span>
            <InputText
              value={createState.sku}
              invalid={false}
              type="text"
              placeholder="SKU-001"
              onChange={(v) => emit(SellerDashboardAction.onChangeSku(v))}
            />
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Description</span>
            <InputText
              value={createState.description}
              invalid={false}
              type="text"
              placeholder="Product description"
              onChange={(v) =>
                emit(SellerDashboardAction.onChangeDescription(v))
              }
            />
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Variant Setup</span>
            <div className={styles.variantModeRow}>
              {variantModeOptions.map((option) => (
                <button
                  key={option.value}
                  className={
                    createState.variantMode === option.value
                      ? styles.variantModeButtonActive
                      : styles.variantModeButton
                  }
                  onClick={() =>
                    emit(
                      SellerDashboardAction.onChangeVariantMode(option.value),
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            {createState.variantMode === "PRESET" ? (
              <div className={styles.variantGrid}>
                {variantSizes.map((size) => (
                  <div
                    key={size}
                    className={styles.variantCard}
                  >
                    <span className={styles.variantLabel}>{size}</span>
                    <InputText
                      value={createState.presetVariantStocks[size]}
                      invalid={false}
                      type="number"
                      placeholder="0"
                      onChange={(v) =>
                        emit(
                          SellerDashboardAction.onChangePresetVariantStock(
                            size,
                            v,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {createState.variantMode === "NONE" ? (
              <div className={styles.singleVariantCard}>
                <span className={styles.variantLabel}>Total Stock</span>
                <InputText
                  value={createState.singleVariantStock}
                  invalid={false}
                  type="number"
                  placeholder="0"
                  onChange={(v) =>
                    emit(SellerDashboardAction.onChangeSingleVariantStock(v))
                  }
                />
              </div>
            ) : null}

            {createState.variantMode === "CUSTOM" ? (
              <div className={styles.customList}>
                {createState.customVariants.map((variant, index) => (
                  <div
                    key={`${index}-${variant.name}`}
                    className={styles.customRow}
                  >
                    <InputText
                      value={variant.name}
                      invalid={false}
                      type="text"
                      placeholder="Variant name (e.g. XXL, Red)"
                      onChange={(v) =>
                        emit(
                          SellerDashboardAction.onChangeCustomVariantName(
                            index,
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
                          SellerDashboardAction.onChangeCustomVariantStock(
                            index,
                            v,
                          ),
                        )
                      }
                    />
                    <button
                      className={styles.deleteButton}
                      onClick={() =>
                        emit(SellerDashboardAction.onRemoveCustomVariant(index))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className={styles.secondaryButton}
                  onClick={() =>
                    emit(SellerDashboardAction.onAddCustomVariant())
                  }
                >
                  Add Variant
                </button>
              </div>
            ) : null}
          </div>

          <div className={styles.fieldFull}>
            <span className={styles.label}>Images</span>
            <div className={styles.imageList}>
              {createState.imageUrls.map((url) => (
                <div
                  key={url}
                  className={styles.imageRow}
                >
                  <span className={styles.muted}>{url}</span>
                  <button
                    className={styles.deleteButton}
                    onClick={() =>
                      emit(SellerDashboardAction.removeImageUrl(url))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
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
                      emit(SellerDashboardAction.uploadProductImages(files))
                    }
                  }
                  input.click()
                }
              }}
            >
              Upload Images
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            theme_={"Red"}
            size={"M"}
            label={
              createState.createResponse._t === "Loading"
                ? "Creating..."
                : "Create Product"
            }
            onClick={() => emit(SellerDashboardAction.submitCreateProduct())}
            disabled={createState.createResponse._t === "Loading"}
          />
        </div>
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

    if (item.children.length === 0) {
      return [{ id: item.id.unwrap(), label: path.join(" - ") }]
    }

    return toCategoryOptions(item.children, path)
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
    whiteSpace: "pre-wrap",
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
  variantGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.s2,
  }),
  variantModeRow: css({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.s2,
    marginBottom: theme.s2,
  }),
  variantModeButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    cursor: "pointer",
  }),
  variantModeButtonActive: css({
    border: `1px solid ${color.genz.purple}`,
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    cursor: "pointer",
  }),
  variantCard: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    background: color.neutral50,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  variantLabel: css({
    ...font.medium12,
    color: color.genz.purple,
  }),
  singleVariantCard: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: theme.s2,
    background: color.neutral50,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    maxWidth: "260px",
  }),
  customList: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  customRow: css({
    display: "grid",
    gridTemplateColumns: "1fr 140px auto",
    gap: theme.s2,
    alignItems: "center",
    ...bp.md({
      gridTemplateColumns: "1fr 180px auto",
    }),
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
  muted: css({
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
  gate: css({
    padding: theme.s8,
  }),
}
