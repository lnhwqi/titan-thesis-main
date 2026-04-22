import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { color, font, theme, bp } from "../View/Theme"
import * as AdminDashboardAction from "../Action/Admin"

type Props = { state: State }

export default function AdminPosterManagementPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const reportWindowHours = state.adminDashboard.reportWindowHours
  const ratingReportMaxPerDay = state.adminDashboard.ratingReportMaxPerDay
  const sellerTierPolicy = state.adminDashboard.sellerTierPolicyResponse

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to manage settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Settings</h1>
          <p className={styles.subtitle}>
            Manage application settings and configurations.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.goToAdminDashboard())}
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>
          How many hours users can submit reports after delivery.
        </h2>
        <div className={styles.formRow}>
          <input
            className={styles.inputInline}
            value={reportWindowHours}
            onChange={(e) =>
              emit(
                AdminDashboardAction.onChangeReportWindowHours(
                  e.currentTarget.value,
                ),
              )
            }
            placeholder="72"
            inputMode="numeric"
          />
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.saveReportWindowHours())}
          >
            Save
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>
          Max spam-report submissions a seller can make per day
        </h2>
        <div className={styles.formRow}>
          <input
            className={styles.inputInline}
            value={ratingReportMaxPerDay}
            onChange={(e) =>
              emit(
                AdminDashboardAction.onChangeRatingReportMaxPerDay(
                  e.currentTarget.value,
                ),
              )
            }
            placeholder="5"
            inputMode="numeric"
          />
          <button
            className={styles.secondaryButton}
            onClick={() =>
              emit(AdminDashboardAction.saveRatingReportMaxPerDay())
            }
          >
            Save
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.cardTitle}>Seller Tier And Tax Policy</h2>
        <p className={styles.cardText}>
          Set profit thresholds for tier upgrades and tax percentage per tier.
        </p>

        {renderSellerTierPolicyStatus(sellerTierPolicy)}

        <div className={styles.statsRow}>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Silver Threshold</div>
            <input
              className={styles.inputFull}
              value={state.adminDashboard.silverProfitThresholdInput}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeSellerTierPolicyInput(
                    "silverProfitThresholdInput",
                    e.currentTarget.value,
                  ),
                )
              }
              inputMode="numeric"
            />
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Gold Threshold</div>
            <input
              className={styles.inputFull}
              value={state.adminDashboard.goldProfitThresholdInput}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeSellerTierPolicyInput(
                    "goldProfitThresholdInput",
                    e.currentTarget.value,
                  ),
                )
              }
              inputMode="numeric"
            />
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Bronze Tax (%)</div>
            <input
              className={styles.inputFull}
              value={state.adminDashboard.bronzeTaxInput}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeSellerTierPolicyInput(
                    "bronzeTaxInput",
                    e.currentTarget.value,
                  ),
                )
              }
              inputMode="numeric"
            />
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Silver Tax (%)</div>
            <input
              className={styles.inputFull}
              value={state.adminDashboard.silverTaxInput}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeSellerTierPolicyInput(
                    "silverTaxInput",
                    e.currentTarget.value,
                  ),
                )
              }
              inputMode="numeric"
            />
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Gold Tax (%)</div>
            <input
              className={styles.inputFull}
              value={state.adminDashboard.goldTaxInput}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeSellerTierPolicyInput(
                    "goldTaxInput",
                    e.currentTarget.value,
                  ),
                )
              }
              inputMode="numeric"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.loadSellerTierPolicy())}
          >
            Refresh policy
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => emit(AdminDashboardAction.saveSellerTierPolicy())}
            disabled={state.adminDashboard.isSavingSellerTierPolicy}
          >
            {state.adminDashboard.isSavingSellerTierPolicy
              ? "Saving..."
              : "Save policy"}
          </button>
        </div>
      </section>
    </div>
  )
}

function renderSellerTierPolicyStatus(
  response: State["adminDashboard"]["sellerTierPolicyResponse"],
): JSX.Element {
  switch (response._t) {
    case "NotAsked":
      return (
        <div className={styles.sellerMeta}>Policy data not loaded yet.</div>
      )
    case "Loading":
      return <div className={styles.sellerMeta}>Loading policy...</div>
    case "Failure":
      return (
        <div className={styles.sellerMetaError}>Unable to load policy.</div>
      )
    case "Success":
      return (
        <div className={styles.sellerMetaSuccess}>
          Policy loaded from server.
        </div>
      )
  }
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 10% 18%, ${color.secondary100} 0%, transparent 34%),` +
      `radial-gradient(circle at 85% 12%, ${color.secondary200} 0%, transparent 30%),` +
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
    border: `1px solid ${color.secondary100}`,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
    marginBottom: theme.s4,
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    marginTop: 0,
    marginBottom: theme.s4,
    color: color.neutral900,
  }),
  cardTitle: css({
    ...font.boldH5_20,
    marginTop: 0,
    marginBottom: theme.s2,
    color: color.neutral900,
  }),
  cardText: css({
    ...font.regular14,
    color: color.neutral700,
    marginTop: 0,
    marginBottom: theme.s4,
  }),
  statsRow: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s4,
    marginBottom: theme.s5,
    padding: theme.s4,
    background: color.neutral50,
    borderRadius: theme.s3,
    border: `1px solid ${color.secondary100}`,
    ...bp.md({
      gridTemplateColumns: "repeat(2, 1fr)",
    }),
    ...bp.lg({
      gridTemplateColumns: "repeat(5, 1fr)",
    }),
  }),
  statCell: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  statLabel: css({
    ...font.medium14,
    color: color.neutral800,
  }),
  formRow: css({
    display: "flex",
    gap: theme.s3,
    alignItems: "center",
  }),
  inputInline: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    width: "80px",
    "&:focus": {
      outline: "none",
      borderColor: color.secondary500,
    },
  }),
  inputFull: css({
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    width: "120px",
    "&:focus": {
      outline: "none",
      borderColor: color.secondary500,
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
    width: "fit-content",
    transition: "opacity 0.2s",
    "&:hover": {
      opacity: 0.9,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
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
    transition: "background 0.2s",
    "&:hover": {
      background: color.neutral50,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
  }),
  sellerMeta: css({
    ...font.regular13,
    color: color.neutral600,
    marginBottom: theme.s3,
  }),
  sellerMetaError: css({
    ...font.regular13,
    color: color.semantics.error.red500,
    marginBottom: theme.s3,
  }),
  sellerMetaSuccess: css({
    ...font.regular13,
    color: color.semantics.success.green500,
    marginBottom: theme.s3,
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
    border: `1px solid ${color.secondary100}`,
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
}
