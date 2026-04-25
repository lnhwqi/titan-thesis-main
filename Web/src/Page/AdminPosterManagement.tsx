import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import * as AdminPosterAction from "../Action/AdminPoster"
import * as AdminAction from "../Action/Admin"
import { color, font, theme, bp } from "../View/Theme"
import * as SDate from "../../../Core/Data/Time/SDate"

type Props = { state: State }

export default function AdminPosterManagementPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const posterState = state.adminPoster

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to manage posters.
          </p>
        </div>
      </div>
    )
  }

  const pendingDelete =
    posterState.pendingDeletePosterID == null
      ? null
      : posterState.posters.find(
          (item) => item.id.unwrap() === posterState.pendingDeletePosterID,
        )

  return (
    <div className={styles.page}>
      {posterState.flashMessage != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Notice</h2>
            <p className={styles.modalText}>{posterState.flashMessage}</p>
            <button
              className={styles.modalButton}
              onClick={() => emit(AdminPosterAction.clearFlashMessage())}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Poster Management</h1>
          <p className={styles.subtitle}>
            Create and update homepage posters with image crop controls.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminPosterAction.reloadPosterList())}
          >
            Refresh
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminAction.goToAdminDashboard())}
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>
          {posterState.editPosterID == null ? "Create Poster" : "Edit Poster"}
        </h2>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              className={styles.input}
              value={posterState.name}
              placeholder="Summer Sale Banner"
              onChange={(e) =>
                emit(AdminPosterAction.onChangeName(e.currentTarget.value))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              value={posterState.description}
              placeholder="Big discounts for all categories"
              onChange={(e) =>
                emit(
                  AdminPosterAction.onChangeDescription(e.currentTarget.value),
                )
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Choose Local Image</span>
            <input
              className={styles.fileInput}
              type="file"
              accept="image/*"
              disabled={posterState.isUploadingImage}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0]
                if (file == null) {
                  return
                }
                emit(AdminPosterAction.uploadPosterImage(file))
                e.currentTarget.value = ""
              }}
            />
            <span className={styles.fileHint}>
              {posterState.isUploadingImage
                ? "Uploading image..."
                : posterState.imageUrl.trim() === ""
                  ? "No image selected"
                  : "Image selected"}
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Start Date</span>
            <input
              className={styles.input}
              type="date"
              value={posterState.startDate}
              onChange={(e) =>
                emit(AdminPosterAction.onChangeStartDate(e.currentTarget.value))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>End Date</span>
            <input
              className={styles.input}
              type="date"
              value={posterState.endDate}
              disabled={posterState.isPermanent}
              onChange={(e) =>
                emit(AdminPosterAction.onChangeEndDate(e.currentTarget.value))
              }
            />
          </label>
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={posterState.isPermanent}
            onChange={(e) =>
              emit(AdminPosterAction.onChangePermanent(e.currentTarget.checked))
            }
          />
          <span>Permanent poster (no end date)</span>
        </label>

        <div className={styles.previewPanel}>
          <h3 className={styles.previewTitle}>Image Position & Scale</h3>
          <div className={styles.sliderGrid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Scale ({posterState.imageScalePercent || "100"}%)
              </span>
              <input
                type="range"
                min="10"
                max="300"
                value={posterState.imageScalePercent}
                onChange={(e) =>
                  emit(
                    AdminPosterAction.onChangeImageScalePercent(
                      e.currentTarget.value,
                    ),
                  )
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Offset X ({posterState.imageOffsetXPercent || "0"}%)
              </span>
              <input
                type="range"
                min="-100"
                max="100"
                value={posterState.imageOffsetXPercent}
                onChange={(e) =>
                  emit(
                    AdminPosterAction.onChangeImageOffsetXPercent(
                      e.currentTarget.value,
                    ),
                  )
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Offset Y ({posterState.imageOffsetYPercent || "0"}%)
              </span>
              <input
                type="range"
                min="-100"
                max="100"
                value={posterState.imageOffsetYPercent}
                onChange={(e) =>
                  emit(
                    AdminPosterAction.onChangeImageOffsetYPercent(
                      e.currentTarget.value,
                    ),
                  )
                }
              />
            </label>
          </div>

          <div className={styles.previewFrame}>
            {posterState.imageUrl.trim() === "" ? (
              <div className={styles.previewEmpty}>No image selected</div>
            ) : (
              <img
                className={styles.previewImage}
                src={posterState.imageUrl}
                alt="Poster Preview"
                style={{
                  transform: `translate(${posterState.imageOffsetXPercent || "0"}%, ${posterState.imageOffsetYPercent || "0"}%) scale(${(Number(posterState.imageScalePercent) || 100) / 100})`,
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {posterState.editPosterID == null ? (
            <button
              className={styles.primaryButton}
              onClick={() => emit(AdminPosterAction.submitCreatePoster())}
              disabled={posterState.createResponse._t === "Loading"}
            >
              {posterState.createResponse._t === "Loading"
                ? "Creating..."
                : "Create Poster"}
            </button>
          ) : (
            <>
              <button
                className={styles.secondaryButton}
                onClick={() => emit(AdminPosterAction.cancelEditPoster())}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => emit(AdminPosterAction.submitUpdatePoster())}
                disabled={posterState.updateResponse._t === "Loading"}
              >
                {posterState.updateResponse._t === "Loading"
                  ? "Updating..."
                  : "Save Update"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Poster List</h2>

        {posterState.listResponse._t === "Loading" ? (
          <div className={styles.muted}>Loading posters...</div>
        ) : null}

        {posterState.listResponse._t === "Failure" ? (
          <div className={styles.muted}>Cannot load posters.</div>
        ) : null}

        {posterState.listResponse._t === "Success" &&
        posterState.posters.length === 0 ? (
          <div className={styles.muted}>No posters yet.</div>
        ) : null}

        <div className={styles.listGrid}>
          {posterState.posters.map((poster) => (
            <article
              className={styles.posterCard}
              key={poster.id.unwrap()}
            >
              <div className={styles.posterImageWrap}>
                <img
                  className={styles.posterImage}
                  src={poster.imageUrl.unwrap()}
                  alt={poster.name.unwrap()}
                />
              </div>
              <div className={styles.posterContent}>
                <h3 className={styles.posterName}>{poster.name.unwrap()}</h3>
                <p className={styles.posterDescription}>
                  {poster.description.unwrap()}
                </p>
                <p className={styles.posterMeta}>
                  Start: {SDate.toString(poster.startDate)}
                </p>
                <p className={styles.posterMeta}>
                  End:{" "}
                  {poster.endDate == null
                    ? "Permanent"
                    : SDate.toString(poster.endDate)}
                </p>
                <div className={styles.rowActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() =>
                      emit(
                        AdminPosterAction.startEditPoster(poster.id.unwrap()),
                      )
                    }
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() =>
                      emit(
                        AdminPosterAction.requestDeletePoster(
                          poster.id.unwrap(),
                        ),
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {pendingDelete != null ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Delete Poster</h2>
            <p className={styles.modalText}>
              Delete poster {pendingDelete.name.unwrap()}?
            </p>
            <div className={styles.rowActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => emit(AdminPosterAction.cancelDeletePoster())}
              >
                Cancel
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => emit(AdminPosterAction.confirmDeletePoster())}
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

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.genz.purple100} 0%, transparent 34%),` +
      `radial-gradient(circle at 85% 12%, ${color.genz.purple200} 0%, transparent 30%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    marginBottom: theme.s6,
  }),
  title: css({
    ...font.boldH1_42,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    marginTop: theme.s2,
  }),
  panel: css({
    background: color.neutral0,
    borderRadius: theme.s4,
    border: `1px solid ${color.genz.purple100}`,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    marginTop: 0,
    marginBottom: theme.s4,
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
    ...font.regular13,
    color: color.neutral700,
  }),
  input: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
  }),
  textarea: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    minHeight: "96px",
  }),
  fileInput: css({
    ...font.regular14,
  }),
  fileHint: css({
    ...font.regular12,
    color: color.neutral600,
  }),
  checkboxRow: css({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s2,
    marginTop: theme.s3,
    ...font.regular14,
  }),
  previewPanel: css({
    marginTop: theme.s4,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    background: color.neutral50,
  }),
  previewTitle: css({
    ...font.bold14,
    marginTop: 0,
    marginBottom: theme.s3,
  }),
  sliderGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s2,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr 1fr",
    }),
  }),
  previewFrame: css({
    marginTop: theme.s3,
    width: "100%",
    maxWidth: "640px",
    aspectRatio: "16 / 9",
    borderRadius: theme.s2,
    border: `1px solid ${color.genz.purple200}`,
    background: color.neutral100,
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  previewImage: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transformOrigin: "center center",
    transition: "transform 0.2s ease",
  }),
  previewEmpty: css({
    ...font.regular14,
    color: color.neutral600,
  }),
  actions: css({
    marginTop: theme.s4,
    display: "flex",
    gap: theme.s2,
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
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
    width: "fit-content",
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
  }),
  listGrid: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s3,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  posterCard: css({
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    background: color.neutral0,
    overflow: "hidden",
  }),
  posterImageWrap: css({
    width: "100%",
    aspectRatio: "16 / 9",
    background: color.neutral100,
  }),
  posterImage: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }),
  posterContent: css({
    padding: theme.s3,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  posterName: css({
    ...font.bold14,
    margin: 0,
  }),
  posterDescription: css({
    ...font.regular13,
    color: color.neutral700,
    margin: 0,
  }),
  posterMeta: css({
    ...font.regular12,
    color: color.neutral600,
    margin: 0,
  }),
  rowActions: css({
    marginTop: theme.s2,
    display: "flex",
    gap: theme.s2,
  }),
  deleteButton: css({
    border: "none",
    background: color.semantics.error.red500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    ...font.medium14,
    cursor: "pointer",
  }),
  muted: css({
    ...font.regular14,
    color: color.neutral600,
  }),
  gate: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.neutral100,
    padding: theme.s6,
  }),
  gateCard: css({
    width: "100%",
    maxWidth: "480px",
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.medium,
    padding: theme.s6,
  }),
  gateTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  gateText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: 0,
  }),
  modalOverlay: css({
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(18,24,38,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.s4,
  }),
  modalCard: css({
    width: "100%",
    maxWidth: "460px",
    background: color.neutral0,
    borderRadius: theme.s3,
    border: `1px solid ${color.genz.purple200}`,
    padding: theme.s4,
    boxShadow: theme.elevation.large,
  }),
  modalTitle: css({
    ...font.boldH5_20,
    margin: 0,
  }),
  modalText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: theme.s2,
    marginBottom: theme.s3,
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
}
