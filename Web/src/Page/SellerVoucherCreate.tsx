import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as AuthToken from "../App/AuthToken"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import * as VoucherAction from "../Action/Voucher"

type Props = { state: State }

export default function SellerVoucherCreatePage(props: Props): JSX.Element {
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

  const voucher = state.voucher
  const pendingDelete =
    voucher.pendingDeleteVoucherID == null
      ? null
      : voucher.vouchers.find(
          (item) => item.id.unwrap() === voucher.pendingDeleteVoucherID,
        )

  return (
    <div className={styles.page}>
      {voucher.flashMessage != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Notice</h2>
            <p className={styles.modalText}>{voucher.flashMessage}</p>
            <button
              className={styles.modalButton}
              onClick={() => emit(VoucherAction.clearFlashMessage())}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Voucher Management</h1>
          <p className={styles.subtitle}>
            Create, update, and delete all vouchers from one page.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(VoucherAction.reloadVoucherList())}
          >
            Refresh
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(VoucherAction.goToSellerDashboard())}
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Create Voucher</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Voucher Name</span>
            <InputText
              value={voucher.name}
              invalid={false}
              type="text"
              placeholder="Ramadan Special"
              onChange={(v) => emit(VoucherAction.onChangeName(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Voucher Code</span>
            <InputText
              value={voucher.code}
              invalid={false}
              type="text"
              placeholder="RAMADAN50"
              onChange={(v) => emit(VoucherAction.onChangeCode(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Discount Amount</span>
            <InputText
              value={voucher.discount}
              invalid={false}
              type="number"
              placeholder="50000"
              onChange={(v) => emit(VoucherAction.onChangeDiscount(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Minimum Order Value</span>
            <InputText
              value={voucher.minOrderValue}
              invalid={false}
              type="number"
              placeholder="200000"
              onChange={(v) => emit(VoucherAction.onChangeMinOrderValue(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Usage Limit</span>
            <InputText
              value={voucher.limit}
              invalid={false}
              type="number"
              placeholder="100"
              onChange={(v) => emit(VoucherAction.onChangeLimit(v))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Expired Date</span>
            <InputText
              value={voucher.expiredDate}
              invalid={false}
              type="date"
              onChange={(v) => emit(VoucherAction.onChangeExpiredDate(v))}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            theme_={"Red"}
            size={"M"}
            label={
              voucher.createResponse._t === "Loading"
                ? "Creating..."
                : "Create Voucher"
            }
            onClick={() => emit(VoucherAction.submitCreateVoucher())}
            disabled={voucher.createResponse._t === "Loading"}
          />
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Voucher List</h2>

        {voucher.listResponse._t === "Loading" ? (
          <div className={styles.muted}>Loading vouchers...</div>
        ) : null}

        {voucher.listResponse._t === "Failure" ? (
          <div className={styles.errorText}>Cannot load vouchers.</div>
        ) : null}

        {voucher.listResponse._t === "Success" &&
        voucher.vouchers.length === 0 ? (
          <div className={styles.muted}>No vouchers yet.</div>
        ) : null}

        {voucher.listResponse._t === "Success" &&
        voucher.vouchers.length > 0 ? (
          <div className={styles.list}>
            {voucher.vouchers.map((item) => {
              const isEditing = voucher.editVoucherID === item.id.unwrap()
              return (
                <article
                  key={item.id.unwrap()}
                  className={styles.voucherCard}
                >
                  <div className={styles.voucherTopRow}>
                    <div>
                      <div className={styles.voucherName}>
                        {item.name.unwrap()}
                      </div>
                      <div className={styles.voucherCode}>
                        {item.code.unwrap()}
                      </div>
                    </div>
                    <span
                      className={`${styles.badge} ${item.active.unwrap() ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      {item.active.unwrap() ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className={styles.metaGrid}>
                    <div>
                      Discount: {formatCurrency(item.discount.unwrap())}
                    </div>
                    <div>
                      Min order: {formatCurrency(item.minOrderValue.unwrap())}
                    </div>
                    <div>Limit: {item.limit.unwrap()}</div>
                    <div>Used: {item.usedCount.unwrap()}</div>
                    <div>Expired: {formatDate(item.expiredDate.unwrap())}</div>
                  </div>

                  {isEditing ? (
                    <div className={styles.editPanel}>
                      <div className={styles.field}>
                        <span className={styles.label}>Name</span>
                        <InputText
                          value={voucher.editName}
                          invalid={false}
                          type="text"
                          onChange={(v) =>
                            emit(VoucherAction.onChangeEditName(v))
                          }
                        />
                      </div>
                      <div className={styles.field}>
                        <span className={styles.label}>Limit</span>
                        <InputText
                          value={voucher.editLimit}
                          invalid={false}
                          type="number"
                          onChange={(v) =>
                            emit(VoucherAction.onChangeEditLimit(v))
                          }
                        />
                      </div>
                      <div className={styles.field}>
                        <span className={styles.label}>Expired Date</span>
                        <InputText
                          value={voucher.editExpiredDate}
                          invalid={false}
                          type="date"
                          onChange={(v) =>
                            emit(VoucherAction.onChangeEditExpiredDate(v))
                          }
                        />
                      </div>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={voucher.editActive}
                          onChange={(e) =>
                            emit(
                              VoucherAction.onChangeEditActive(
                                e.currentTarget.checked,
                              ),
                            )
                          }
                        />
                        <span>Active voucher</span>
                      </label>
                    </div>
                  ) : null}

                  <div className={styles.rowActions}>
                    {isEditing ? (
                      <>
                        <button
                          className={styles.secondaryButton}
                          onClick={() =>
                            emit(VoucherAction.cancelEditVoucher())
                          }
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.primaryButton}
                          onClick={() =>
                            emit(VoucherAction.submitUpdateVoucher())
                          }
                        >
                          Save Update
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={styles.secondaryButton}
                          onClick={() =>
                            emit(
                              VoucherAction.startEditVoucher(item.id.unwrap()),
                            )
                          }
                        >
                          Update
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() =>
                            emit(
                              VoucherAction.requestDeleteVoucher(
                                item.id.unwrap(),
                              ),
                            )
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>

      {pendingDelete != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Delete Voucher</h2>
            <p className={styles.modalText}>
              Delete voucher {pendingDelete.name.unwrap()} (
              {pendingDelete.code.unwrap()})?
            </p>
            <div className={styles.rowActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => emit(VoucherAction.cancelDeleteVoucher())}
              >
                Cancel
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => emit(VoucherAction.confirmDeleteVoucher())}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatCurrency(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-CA")
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
  headerActions: css({
    display: "flex",
    gap: theme.s2,
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
    marginBottom: theme.s4,
  }),
  sectionTitle: css({
    ...font.bold17,
    margin: `0 0 ${theme.s3} 0`,
    color: color.genz.purple,
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
  label: css({
    ...font.medium14,
    color: color.neutral700,
  }),
  actions: css({
    marginTop: theme.s4,
    display: "flex",
    justifyContent: "flex-end",
  }),
  list: css({
    display: "grid",
    gap: theme.s3,
  }),
  voucherCard: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s3,
    display: "grid",
    gap: theme.s2,
    background: color.neutral0,
  }),
  voucherTopRow: css({
    display: "flex",
    justifyContent: "space-between",
    gap: theme.s2,
    alignItems: "flex-start",
  }),
  voucherName: css({
    ...font.bold14,
    color: color.genz.purple,
  }),
  voucherCode: css({
    ...font.medium12,
    color: color.neutral600,
  }),
  badge: css({
    ...font.medium12,
    borderRadius: theme.s6,
    padding: `${theme.s1} ${theme.s2}`,
    border: `1px solid ${color.genz.purple200}`,
  }),
  badgeActive: css({
    background: color.genz.purpleDim,
    color: color.genz.purple,
  }),
  badgeInactive: css({
    background: color.neutral100,
    color: color.neutral600,
  }),
  metaGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s1,
    ...font.regular13,
    color: color.neutral700,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  editPanel: css({
    display: "grid",
    gap: theme.s2,
    padding: theme.s2,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s2,
    background: color.neutral50,
  }),
  rowActions: css({
    display: "flex",
    gap: theme.s2,
    justifyContent: "flex-end",
  }),
  checkboxRow: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    ...font.regular13,
    color: color.neutral700,
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
  gate: css({
    padding: theme.s8,
  }),
  muted: css({
    ...font.regular14,
    color: color.neutral600,
  }),
  errorText: css({
    ...font.regular14,
    color: color.semantics.error.red500,
  }),
  primaryButton: css({
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
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
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
}
