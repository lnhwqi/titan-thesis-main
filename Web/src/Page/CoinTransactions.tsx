import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import type { WalletTransactionKind } from "../Api/Auth/User/WalletTransactions"
import {
  AuthPageShell,
  AuthPageHeader,
  AuthPageCard,
  AuthGateCard,
} from "../View/Part/AuthPageShell"

type Props = { state: State }

export default function CoinTransactionsPage(props: Props): JSX.Element {
  const { state } = props

  if (!("updateProfile" in state)) {
    return (
      <AuthPageShell>
        <AuthGateCard
          title="Wallet Transactions"
          message="Please login to view your wallet transaction history."
          loginRedirect="/coins"
        />
      </AuthPageShell>
    )
  }

  const txState = state.walletTransaction
  const transactions =
    txState.response._t === "Success" ? txState.response.data.transactions : []
  const currentBalance =
    txState.response._t === "Success"
      ? txState.response.data.currentBalance
      : state.profile.wallet.unwrap()

  const totalIn = transactions
    .filter((t) => t.kind !== "PAYMENT")
    .reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions
    .filter((t) => t.kind === "PAYMENT")
    .reduce((s, t) => s + t.amount, 0)

  return (
    <AuthPageShell>
      <div className={styles.headerRow}>
        <AuthPageHeader title="Wallet Transactions" />
        <button
          className={styles.backBtn}
          onClick={() => emit(navigateTo(toRoute("Profile", {})))}
        >
          ← Profile
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryBody}>
            <span className={styles.summaryLabel}>Current Balance</span>
            <strong className={styles.summaryValue}>
              {formatT(currentBalance)}
            </strong>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardIn}`}>
          <div className={styles.summaryBody}>
            <span className={styles.summaryLabel}>Total In</span>
            <strong className={`${styles.summaryValue} ${styles.amountIn}`}>
              +{formatT(totalIn)}
            </strong>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardOut}`}>
          <div className={styles.summaryBody}>
            <span className={styles.summaryLabel}>Total Spent</span>
            <strong className={`${styles.summaryValue} ${styles.amountOut}`}>
              -{formatT(totalOut)}
            </strong>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryBody}>
            <span className={styles.summaryLabel}>Transactions</span>
            <strong className={styles.summaryValue}>
              {transactions.length}
            </strong>
          </div>
        </div>
      </div>

      <AuthPageCard>
        {txState.response._t === "Loading" ||
        txState.response._t === "NotAsked" ? (
          <div className={styles.notice}>Loading transactions…</div>
        ) : null}

        {txState.response._t === "Failure" ? (
          <div className={styles.noticeError}>
            Could not load transactions. Please try again.
          </div>
        ) : null}

        {txState.response._t === "Success" && transactions.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              No wallet activity yet. Deposit, collect coins, or make a
              purchase!
            </p>
          </div>
        ) : null}

        {transactions.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Description</th>
                  <th className={styles.th}>Date &amp; Time</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isOut = tx.kind === "PAYMENT"
                  return (
                    <tr
                      key={tx.id}
                      className={styles.tr}
                    >
                      <td className={styles.td}>
                        <span
                          className={`${styles.kindPill} ${kindPillClass(tx.kind)}`}
                        >
                          {kindLabel(tx.kind)}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.tdDesc}`}>
                        {tx.description}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateText}>
                          {formatDate(tx.occurredAt)}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        <span
                          className={isOut ? styles.amountOut : styles.amountIn}
                        >
                          {isOut ? "-" : "+"}
                          {formatT(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </AuthPageCard>
    </AuthPageShell>
  )
}

function kindLabel(kind: WalletTransactionKind): string {
  switch (kind) {
    case "COIN_RAIN":
      return "Coin Rain"
    case "DEPOSIT":
      return "Deposit"
    case "PAYMENT":
      return "Payment"
    default:
      return kind
  }
}

function kindPillClass(kind: WalletTransactionKind): string {
  switch (kind) {
    case "COIN_RAIN":
      return styles.pillCoin
    case "DEPOSIT":
      return styles.pillDeposit
    case "PAYMENT":
      return styles.pillPayment
    default:
      return ""
  }
}

function formatT(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

const styles = {
  headerRow: css({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.s4,
    flexWrap: "wrap",
  }),

  backBtn: css({
    ...font.medium14,
    color: "var(--app-accent)",
    background: "var(--app-accent-soft)",
    border: "none",
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s4}`,
    cursor: "pointer",
    whiteSpace: "nowrap",
    alignSelf: "flex-start",
    marginTop: theme.s1,
    ":hover": { opacity: 0.8 },
  }),

  summaryGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: theme.s4,
  }),

  summaryCard: css({
    background: "var(--app-surface-strong)",
    border: "1px solid var(--app-border)",
    borderRadius: theme.s3,
    padding: theme.s5,
    display: "flex",
    alignItems: "center",
    gap: theme.s4,
    boxShadow: "var(--app-shadow-xs)",
  }),

  summaryCardIn: css({
    borderColor: color.semantics.success.green50,
    background: color.semantics.success.green20,
  }),

  summaryCardOut: css({
    borderColor: color.semantics.error.red50,
    background: color.semantics.error.red20,
  }),

  summaryBody: css({ display: "flex", flexDirection: "column", gap: "2px" }),

  summaryLabel: css({
    ...font.regular12,
    color: "var(--app-text-muted)",
  }),

  summaryValue: css({
    ...font.boldH5_20,
    color: "var(--app-text)",
    lineHeight: 1.2,
  }),

  tableWrapper: css({ overflowX: "auto" }),
  table: css({ width: "100%", borderCollapse: "collapse" }),

  th: css({
    ...font.medium14,
    color: "var(--app-text-soft)",
    textAlign: "left",
    padding: `${theme.s3} ${theme.s4}`,
    borderBottom: `2px solid var(--app-border)`,
    whiteSpace: "nowrap",
  }),

  thRight: css({ textAlign: "right" }),

  tr: css({
    borderBottom: `1px solid var(--app-border)`,
    ":last-child": { borderBottom: "none" },
    ":hover": { background: "var(--app-surface-muted)" },
  }),

  td: css({
    ...font.regular14,
    padding: `${theme.s3} ${theme.s4}`,
    color: "var(--app-text)",
    verticalAlign: "middle",
  }),

  tdRight: css({ textAlign: "right" }),

  tdDesc: css({
    maxWidth: "260px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--app-text-soft)",
  }),

  dateText: css({ color: "var(--app-text-soft)", whiteSpace: "nowrap" }),

  kindPill: css({
    ...font.medium12,
    borderRadius: theme.s1,
    padding: `2px ${theme.s2}`,
    display: "inline-block",
    whiteSpace: "nowrap",
  }),

  pillCoin: css({
    color: color.semantics.warning.orange500,
    background: color.semantics.warning.orange20,
  }),

  pillDeposit: css({
    color: color.semantics.info.blue500,
    background: color.semantics.info.blue20,
  }),

  pillPayment: css({
    color: color.semantics.error.red500,
    background: color.semantics.error.red20,
  }),

  amountIn: css({
    ...font.bold14,
    color: color.semantics.success.green500,
  }),

  amountOut: css({
    ...font.bold14,
    color: color.semantics.error.red500,
  }),

  notice: css({
    ...font.regular14,
    color: "var(--app-text-soft)",
    textAlign: "center",
    padding: `${theme.s10} 0`,
  }),

  noticeError: css({
    ...font.regular14,
    color: color.semantics.error.red500,
    background: color.semantics.error.red50,
    borderRadius: theme.s2,
    padding: theme.s4,
    textAlign: "center",
  }),

  empty: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s3,
    padding: `${theme.s10} 0`,
  }),

  emptyText: css({
    ...font.regular14,
    color: "var(--app-text-soft)",
    textAlign: "center",
    margin: 0,
  }),
}
