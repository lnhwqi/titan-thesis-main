import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { emit } from "../Runtime/React"
import { color, font, theme, bp } from "../View/Theme"
import * as AdminDashboardAction from "../Action/Admin"
import { navigateTo, toRoute } from "../Route"
import * as RD from "../../../Core/Data/RemoteData"
import { User } from "../../../Core/App/User"

type Props = { state: State }

export default function AdminUserManagementPage(props: Props): JSX.Element {
  const { state } = props
  const auth = AuthToken.get()
  const isAdmin = auth != null && auth.role === "ADMIN"
  const usersResponse = state.adminDashboard.allUsersResponse
  const togglingIDs = state.adminDashboard.togglingUserActiveIDs
  const modal = state.adminDashboard.sendUserMessageModal
  const sendingResponse = state.adminDashboard.sendUserMessageResponse
  const filter = state.adminDashboard.userMgmtFilter
  const search = state.adminDashboard.userMgmtSearch
  const flashMessage = state.adminDashboard.flashMessage

  if (!isAdmin) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Admin Access Required</h1>
          <p className={styles.gateText}>
            Please login as admin to manage users.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>
            View all users, send support messages, and manage account status.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => emit(navigateTo(toRoute("AdminDashboard", {})))}
          >
            Back to dashboard
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => emit(AdminDashboardAction.loadAllUsers())}
          >
            Refresh
          </button>
        </div>
      </header>

      {flashMessage != null ? (
        <div className={styles.flashBanner}>
          <span>{flashMessage}</span>
          <button
            className={styles.flashDismiss}
            onClick={() => emit(AdminDashboardAction.clearFlashMessage())}
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) =>
            emit(AdminDashboardAction.changeUserMgmtSearch(e.target.value))
          }
        />
        <div className={styles.filterGroup}>
          {(["all", "active", "inactive"] satisfies ("all" | "active" | "inactive")[]).map((f) => (
            <button
              key={f}
              className={
                filter === f ? styles.filterButtonActive : styles.filterButton
              }
              onClick={() => emit(AdminDashboardAction.changeUserMgmtFilter(f))}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {renderUsers(usersResponse, togglingIDs, filter, search)}

      {modal !== null ? (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Send Message to {modal.userName}
            </h2>
            <p className={styles.modalHint}>
              This message will appear in the user&apos;s support chat.
            </p>
            <textarea
              className={styles.textarea}
              rows={5}
              placeholder="Type your message here..."
              value={modal.message}
              onChange={(e) =>
                emit(
                  AdminDashboardAction.onChangeUserMessageText(e.target.value),
                )
              }
            />
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => emit(AdminDashboardAction.closeSendMessageModal())}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={
                  sendingResponse._t === "Loading" ||
                  modal.message.trim() === ""
                }
                onClick={() => emit(AdminDashboardAction.submitUserMessage())}
              >
                {sendingResponse._t === "Loading" ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function renderUsers(
  response: RD.RemoteData<unknown, { users: User[] }>,
  togglingIDs: string[],
  filter: "all" | "active" | "inactive",
  search: string,
): JSX.Element {
  if (response._t === "NotAsked" || response._t === "Loading") {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading users...</p>
      </div>
    )
  }

  if (response._t === "Failure") {
    return (
      <div className={styles.errorBox}>
        <p>Failed to load users.</p>
      </div>
    )
  }

  const query = search.trim().toLowerCase()
  const filtered = response.data.users.filter((u) => {
    const matchesSearch =
      query === "" ||
      u.name.unwrap().toLowerCase().includes(query) ||
      u.email.unwrap().toLowerCase().includes(query)

    const active = u.active.unwrap()
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && active) ||
      (filter === "inactive" && !active)

    return matchesSearch && matchesFilter
  })

  if (filtered.length === 0) {
    return (
      <div className={styles.emptyBox}>
        <p>No users found.</p>
      </div>
    )
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Tier</th>
            <th className={styles.th}>Points</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => {
            const uid = user.id.unwrap()
            const isActive = user.active.unwrap()
            const toggling = togglingIDs.includes(uid)

            return (
              <tr key={uid} className={styles.tr}>
                <td className={styles.td}>{user.name.unwrap()}</td>
                <td className={styles.td}>{user.email.unwrap()}</td>
                <td className={styles.td}>{user.tier.unwrap()}</td>
                <td className={styles.td}>{user.points.unwrap()}</td>
                <td className={styles.td}>
                  <span
                    className={
                      isActive ? styles.badgeActive : styles.badgeInactive
                    }
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className={styles.tdActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() =>
                      emit(
                        AdminDashboardAction.openSendMessageModal(
                          uid,
                          user.name.unwrap(),
                        ),
                      )
                    }
                  >
                    Message
                  </button>
                  <button
                    className={
                      isActive
                        ? styles.actionButtonDanger
                        : styles.actionButtonSuccess
                    }
                    disabled={toggling}
                    onClick={() =>
                      emit(
                        AdminDashboardAction.toggleUserActive(uid, !isActive),
                      )
                    }
                  >
                    {toggling
                      ? "..."
                      : isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  page: css({
    minHeight: "100dvh",
    padding: theme.s6,
    background: color.neutral20,
    ...bp.md({ padding: `${theme.s10} ${theme.s12}` }),
  }),
  gate: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    background: color.neutral20,
  }),
  gateCard: css({
    background: color.neutral0,
    padding: theme.s8,
    borderRadius: theme.s3,
    textAlign: "center",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  }),
  gateTitle: css({
    ...font.boldH2_35,
    color: color.neutral800,
    marginBottom: theme.s2,
  }),
  gateText: css({
    ...font.regular17,
    color: color.neutral500,
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: theme.s4,
    marginBottom: theme.s6,
  }),
  title: css({
    ...font.boldH1_42,
    color: color.neutral800,
    marginBottom: theme.s1,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral500,
  }),
  headerActions: css({
    display: "flex",
    gap: theme.s2,
    flexWrap: "wrap",
  }),
  flashBanner: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: color.secondary50,
    color: color.secondary500,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s2,
    padding: `${theme.s3} ${theme.s4}`,
    marginBottom: theme.s4,
    ...font.regular14,
  }),
  flashDismiss: css({
    background: "none",
    border: "none",
    cursor: "pointer",
    color: color.secondary500,
    ...font.regular14,
    padding: `0 ${theme.s1}`,
  }),
  toolbar: css({
    display: "flex",
    gap: theme.s3,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: theme.s5,
  }),
  searchInput: css({
    flex: 1,
    minWidth: "220px",
    padding: `${theme.s2} ${theme.s3}`,
    border: `1px solid ${color.neutral100}`,
    borderRadius: theme.s2,
    ...font.regular14,
    color: color.neutral800,
    outline: "none",
    "&:focus": {
      borderColor: color.secondary300,
    },
  }),
  filterGroup: css({
    display: "flex",
    gap: theme.s1,
  }),
  filterButton: css({
    padding: `${theme.s2} ${theme.s3}`,
    border: `1px solid ${color.neutral100}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    color: color.neutral600,
    ...font.regular14,
    cursor: "pointer",
    transition: "all 0.15s",
    "&:hover": { borderColor: color.secondary300, color: color.secondary500 },
  }),
  filterButtonActive: css({
    padding: `${theme.s2} ${theme.s3}`,
    border: `1px solid ${color.secondary500}`,
    borderRadius: theme.s2,
    background: color.secondary500,
    color: color.neutral0,
    ...font.regular14,
    cursor: "pointer",
  }),
  tableWrapper: css({
    overflowX: "auto",
    background: color.neutral0,
    borderRadius: theme.s3,
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  }),
  table: css({
    width: "100%",
    borderCollapse: "collapse",
  }),
  th: css({
    textAlign: "left",
    padding: `${theme.s3} ${theme.s4}`,
    ...font.medium12,
    color: color.neutral500,
    borderBottom: `1px solid ${color.neutral50}`,
    background: color.neutral10,
    whiteSpace: "nowrap",
  }),
  tr: css({
    "&:hover": { background: color.neutral10 },
    "&:not(:last-child)": {
      borderBottom: `1px solid ${color.neutral50}`,
    },
  }),
  td: css({
    padding: `${theme.s3} ${theme.s4}`,
    ...font.regular14,
    color: color.neutral700,
    verticalAlign: "middle",
  }),
  tdActions: css({
    padding: `${theme.s2} ${theme.s4}`,
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
  }),
  badgeActive: css({
    display: "inline-block",
    padding: `2px ${theme.s2}`,
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    ...font.medium12,
    fontWeight: 600,
  }),
  badgeInactive: css({
    display: "inline-block",
    padding: `2px ${theme.s2}`,
    borderRadius: "999px",
    background: color.primary50,
    color: color.primary500,
    ...font.medium12,
    fontWeight: 600,
  }),
  actionButton: css({
    padding: `${theme.s1} ${theme.s3}`,
    border: `1px solid ${color.secondary300}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    color: color.secondary500,
    ...font.medium12,
    cursor: "pointer",
    transition: "all 0.15s",
    "&:hover": { background: color.secondary50 },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  actionButtonDanger: css({
    padding: `${theme.s1} ${theme.s3}`,
    border: `1px solid ${color.primary300}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    color: color.primary500,
    ...font.medium12,
    cursor: "pointer",
    transition: "all 0.15s",
    "&:hover": { background: color.primary50 },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  actionButtonSuccess: css({
    padding: `${theme.s1} ${theme.s3}`,
    border: "1px solid #86efac",
    borderRadius: theme.s2,
    background: color.neutral0,
    color: "#166534",
    ...font.medium12,
    cursor: "pointer",
    transition: "all 0.15s",
    "&:hover": { background: "#f0fdf4" },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  center: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.s10,
    gap: theme.s3,
  }),
  spinner: css({
    width: "32px",
    height: "32px",
    border: `3px solid ${color.neutral100}`,
    borderTopColor: color.secondary500,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    "@keyframes spin": { to: { transform: "rotate(360deg)" } },
  }),
  loadingText: css({
    ...font.regular14,
    color: color.neutral400,
  }),
  errorBox: css({
    background: color.primary50,
    color: color.primary500,
    padding: theme.s4,
    borderRadius: theme.s2,
    ...font.regular14,
    textAlign: "center",
  }),
  emptyBox: css({
    background: color.neutral0,
    padding: theme.s10,
    borderRadius: theme.s3,
    textAlign: "center",
    ...font.regular17,
    color: color.neutral400,
  }),
  overlay: css({
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: theme.s4,
  }),
  modal: css({
    background: color.neutral0,
    borderRadius: theme.s3,
    padding: theme.s6,
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  }),
  modalTitle: css({
    ...font.boldH3_29,
    color: color.neutral800,
    marginBottom: theme.s2,
  }),
  modalHint: css({
    ...font.regular14,
    color: color.neutral500,
    marginBottom: theme.s4,
  }),
  textarea: css({
    width: "100%",
    padding: theme.s3,
    border: `1px solid ${color.neutral100}`,
    borderRadius: theme.s2,
    ...font.regular14,
    color: color.neutral800,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    "&:focus": { borderColor: color.secondary300 },
  }),
  modalActions: css({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.s2,
    marginTop: theme.s4,
  }),
  primaryButton: css({
    padding: `${theme.s2} ${theme.s5}`,
    background: color.secondary500,
    color: color.neutral0,
    border: "none",
    borderRadius: theme.s2,
    ...font.medium14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
    "&:hover:not(:disabled)": { background: color.secondary400 },
    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
  }),
  secondaryButton: css({
    padding: `${theme.s2} ${theme.s5}`,
    background: color.neutral0,
    color: color.neutral700,
    border: `1px solid ${color.neutral100}`,
    borderRadius: theme.s2,
    ...font.medium14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    "&:hover": { background: color.neutral20, borderColor: color.neutral200 },
  }),
}
