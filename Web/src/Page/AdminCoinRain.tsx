import { JSX } from "react"
import { css } from "@emotion/css"
import { color, font, theme, bp } from "../View/Theme"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import * as UpsertCampaignApi from "../Api/Auth/Admin/CoinRain/UpsertCampaign"
import * as AdminDashboardAction from "../Action/Admin"
import { navigateTo, toRoute } from "../Route"
import type { State } from "../State"

export type Props = { state: State }

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background:
      `radial-gradient(circle at 8% 15%, ${color.genz.purple100} 0%, transparent 32%),` +
      `radial-gradient(circle at 90% 10%, rgba(251,191,36,0.12) 0%, transparent 28%),` +
      `${color.neutral50}`,
    ...bp.md({
      padding: `${theme.s10} ${theme.s12}`,
    }),
  }),

  // Header
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: theme.s4,
    marginBottom: theme.s8,
  }),
  kicker: css({
    ...font.medium14,
    color: color.genz.purple,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: `0 0 ${theme.s2}`,
  }),
  title: css({
    ...font.boldH1_42,
    margin: `0 0 ${theme.s2}`,
    background: "linear-gradient(135deg, #7C3AED 0%, #F59E0B 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral700,
    margin: 0,
    maxWidth: "480px",
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
  }),

  // Cards
  card: css({
    background: color.neutral0,
    borderRadius: theme.s4,
    border: `1px solid ${color.genz.purple100}`,
    boxShadow: "0 1px 4px rgba(124,58,237,0.07)",
    padding: theme.s6,
    marginBottom: theme.s4,
  }),
  cardAccent: css({
    background: `linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(245,158,11,0.04) 100%)`,
    borderRadius: theme.s4,
    border: `1px solid ${color.genz.purple100}`,
    boxShadow: "0 1px 4px rgba(124,58,237,0.07)",
    padding: theme.s6,
    marginBottom: theme.s4,
  }),
  cardTitle: css({
    ...font.boldH5_20,
    color: color.neutral900,
    margin: `0 0 ${theme.s2}`,
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  cardIcon: css({
    fontSize: "20px",
    lineHeight: 1,
  }),
  cardDesc: css({
    ...font.regular14,
    color: color.neutral600,
    margin: `0 0 ${theme.s5}`,
    lineHeight: "22px",
  }),

  // Default badge
  defaultBadge: css({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s1,
    background: color.semantics.warning.yellow50,
    color: color.semantics.warning.orange500,
    border: `1px solid ${color.semantics.warning.yellow50}`,
    borderRadius: "999px",
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium12,
    marginBottom: theme.s5,
  }),

  // Form
  fieldGroup: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s5,
    marginBottom: theme.s6,
    ...bp.md({
      gridTemplateColumns: "1fr 1fr",
    }),
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  label: css({
    ...font.medium14,
    color: color.neutral800,
  }),
  hint: css({
    ...font.regular12,
    color: color.neutral500,
    marginTop: `-${theme.s1}`,
  }),
  input: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    color: color.neutral900,
    background: color.neutral0,
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    "&:focus": {
      outline: "none",
      borderColor: color.genz.purple,
      boxShadow: `0 0 0 3px ${color.genz.purple100}`,
    },
  }),

  // Coin pool
  poolHeader: css({
    display: "grid",
    gridTemplateColumns: "32px 1fr 1fr",
    gap: theme.s3,
    padding: `0 ${theme.s2} ${theme.s2}`,
    borderBottom: `1px solid ${color.genz.purple100}`,
    marginBottom: theme.s3,
  }),
  poolHeaderLabel: css({
    ...font.medium12,
    color: color.neutral500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  }),
  poolRow: css({
    display: "grid",
    gridTemplateColumns: "32px 1fr 1fr",
    gap: theme.s3,
    alignItems: "center",
    padding: `${theme.s2} ${theme.s2}`,
    borderRadius: theme.s2,
    "&:nth-child(odd)": {
      background: `rgba(124,58,237,0.02)`,
    },
  }),
  tierBadge: (tier: "bronze" | "silver" | "gold") =>
    css({
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      background:
        tier === "gold"
          ? "linear-gradient(135deg, #F59E0B, #EF4444)"
          : tier === "silver"
            ? "linear-gradient(135deg, #94A3B8, #64748B)"
            : "linear-gradient(135deg, #B45309, #92400E)",
      flexShrink: 0,
    }),
  poolInputWrap: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  poolInput: css({
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    ...font.regular14,
    color: color.neutral900,
    background: color.neutral0,
    width: "100%",
    boxSizing: "border-box",
    "&:focus": {
      outline: "none",
      borderColor: color.genz.purple,
      boxShadow: `0 0 0 3px ${color.genz.purple100}`,
    },
  }),
  poolUnit: css({
    ...font.regular13,
    color: color.neutral500,
    whiteSpace: "nowrap",
    flexShrink: 0,
  }),

  // Actions
  formFooter: css({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.s3,
    paddingTop: theme.s5,
    borderTop: `1px solid ${color.genz.purple100}`,
  }),
  primaryButton: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    border: "none",
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s3} ${theme.s6}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "opacity 0.2s",
    "&:hover": { opacity: 0.88 },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  secondaryButton: css({
    border: `1px solid ${color.genz.purple300}`,
    background: color.neutral0,
    color: color.genz.purple,
    borderRadius: theme.s2,
    padding: `${theme.s3} ${theme.s5}`,
    ...font.medium14,
    cursor: "pointer",
    transition: "background 0.15s",
    "&:hover": { background: color.genz.purple20 },
  }),

  // Gate (access denied)
  gate: css({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.neutral50,
  }),
  gateCard: css({
    background: color.neutral0,
    borderRadius: theme.s4,
    border: `1px solid ${color.semantics.error.red50}`,
    padding: theme.s10,
    textAlign: "center",
    maxWidth: "360px",
  }),
  gateTitle: css({
    ...font.boldH5_20,
    margin: `0 0 ${theme.s3}`,
    color: color.neutral900,
  }),
  gateText: css({ ...font.regular14, color: color.neutral600, margin: 0 }),

  // Divider label
  sectionLabel: css({
    ...font.medium14,
    color: color.neutral700,
    margin: `0 0 ${theme.s3}`,
  }),
}

// ---------------------------------------------------------------------------
// Tier configuration
// ---------------------------------------------------------------------------

type TierConfig = {
  tier: "bronze" | "silver" | "gold"
  emoji: string
  label: string
  defaultValue: number
  defaultQty: number
}

const TIERS: TierConfig[] = [
  {
    tier: "bronze",
    emoji: "🥉",
    label: "Bronze",
    defaultValue: 1000,
    defaultQty: 50,
  },
  {
    tier: "silver",
    emoji: "🥈",
    label: "Silver",
    defaultValue: 5000,
    defaultQty: 20,
  },
  {
    tier: "gold",
    emoji: "🥇",
    label: "Gold",
    defaultValue: 10000,
    defaultQty: 5,
  },
]

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminCoinRainPage(_props: Props): JSX.Element {
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please log in as admin to manage Flash Drop events.
          </p>
        </div>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const rawTime = String(data.get("startTime") ?? "")
    const startTime = rawTime.includes("Z") ? rawTime : rawTime + ":00.000Z"
    const duration = Number(data.get("duration"))

    const values = data.getAll("coinValue").map((v) => Number(v.toString()))
    const quantities = data
      .getAll("coinQuantity")
      .map((v) => Number(v.toString()))

    const coinPool = values
      .map((v, i) => ({ value: v, quantity: quantities[i] ?? 0 }))
      .filter((c) => c.value > 0 && c.quantity > 0)

    if (coinPool.length === 0) {
      alert("Add at least one coin tier with a value and quantity.")
      return
    }

    UpsertCampaignApi.call({ startTime, duration, coinPool })
      .then((res) => {
        if (res._t === "Ok") {
          alert("✅ Campaign saved! The scheduler has been updated.")
        } else {
          alert("❌ Failed to save campaign. Check inputs and try again.")
        }
      })
      .catch(() => alert("⚠️ Network error. Please try again."))
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Event Management</p>
          <h1 className={styles.title}>Flash Drop ✨</h1>
          <p className={styles.subtitle}>
            Schedule a Coin Rain event — coins fall from the sky and users race
            to claim them in real time.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(AdminDashboardAction.goToAdminDashboard())}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* ── Default schedule notice ── */}
      <div className={styles.cardAccent}>
        <div className={styles.defaultBadge}>⚡ Default Schedule</div>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>🗓️</span>
          Auto-recurring fallback
        </h2>
        <p className={styles.cardDesc}>
          If no custom campaign is active, a default event fires{" "}
          <strong>every Friday at 20:00</strong> for 60 seconds with the pool:
          50 × 1,000 coins · 20 × 5,000 coins · 5 × 10,000 coins. Configure a
          custom campaign below to override it.
        </p>
      </div>

      {/* ── Campaign form ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>⚙️</span>
          Custom Campaign
        </h2>
        <p className={styles.cardDesc}>
          Set a one-off start time and duration. The moment the timer fires, all
          connected users receive the event and coins begin falling. Each coin
          can only be claimed by one user.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Timing */}
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="startTime"
              >
                Start Time
              </label>
              <p className={styles.hint}>Local time — when the rain begins</p>
              <input
                id="startTime"
                name="startTime"
                type="datetime-local"
                className={styles.input}
                required
              />
            </div>
            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="duration"
              >
                Duration (seconds)
              </label>
              <p className={styles.hint}>
                How long the event lasts (10 – 300 s)
              </p>
              <input
                id="duration"
                name="duration"
                type="number"
                min="10"
                max="300"
                defaultValue="60"
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Coin pool */}
          <p className={styles.sectionLabel}>
            🪙 Coin Pool — value &amp; quantity per tier
          </p>

          <div className={styles.poolHeader}>
            <div />
            <span className={styles.poolHeaderLabel}>Value per coin</span>
            <span className={styles.poolHeaderLabel}>Quantity</span>
          </div>

          {TIERS.map(({ tier, emoji, label, defaultValue, defaultQty }) => (
            <div
              className={styles.poolRow}
              key={tier}
            >
              <div
                className={styles.tierBadge(tier)}
                title={label}
              >
                {emoji}
              </div>
              <div className={styles.poolInputWrap}>
                <input
                  name="coinValue"
                  type="number"
                  min="1"
                  defaultValue={defaultValue}
                  className={styles.poolInput}
                  aria-label={`${label} coin value`}
                  required
                />
                <span className={styles.poolUnit}>coins</span>
              </div>
              <div className={styles.poolInputWrap}>
                <input
                  name="coinQuantity"
                  type="number"
                  min="1"
                  defaultValue={defaultQty}
                  className={styles.poolInput}
                  aria-label={`${label} coin quantity`}
                  required
                />
                <span className={styles.poolUnit}>pcs</span>
              </div>
            </div>
          ))}

          {/* Footer actions */}
          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => emit(navigateTo(toRoute("AdminDashboard", {})))}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
            >
              🚀 Save Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
