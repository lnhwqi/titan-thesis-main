import { css } from "@emotion/css"
import { JSX } from "react"
import {
  IoIosArrowDown,
  IoMdCart,
  IoMdNotifications,
  IoMdSearch,
} from "react-icons/io"
import { type Action, cmd } from "../../Action"
import { State, _PublicState } from "../../State"
import { localImage } from "../ImageLocalSrc"
import Link from "../Link"
import { navigateTo, toPath, toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as LoginAction from "../../Action/Login"
import * as ProductAction from "../../Action/Product"
import * as CartAction from "../../Action/Cart"
import InputText from "../../View/Form/InputText"
import * as CategoryAction from "../../Action/Category"
import { glowPulse } from "../Theme/Keyframe"

type Props = { state: State }

const closeAvatarMenu: Action = (s) => [
  _PublicState(s, { avatarMenuOpen: false }),
  cmd(),
]
const toggleAvatarMenu: Action = (s) => [
  _PublicState(s, { avatarMenuOpen: !s.avatarMenuOpen }),
  cmd(),
]

export default function Header(props: Props): JSX.Element {
  const { state } = props
  const { isOpen } = state.category
  const query = state.product.searchQuery
  const avatarMenuOpen = state.avatarMenuOpen

  const rawUserName =
    state._t === "AuthUser" ? state.profile.name.unwrap() : "Guest"
  const userName = rawUserName.trim().split(/\s+/).pop() ?? "Guest"
  const userInitial = userName.trim().charAt(0).toUpperCase() || "G"

  // Prefer the globally-refreshed balance; fall back to the profile snapshot
  const effectiveWallet =
    state._t === "AuthUser" ||
    state._t === "AuthSeller" ||
    state._t === "AuthAdmin"
      ? (state.userBalance ?? state.profile.wallet)
      : null
  const walletRaw =
    effectiveWallet != null ? String(effectiveWallet.unwrap()) : ""
  const walletBalance =
    walletRaw.length > 4 ? `${walletRaw.slice(0, 4)}...` : walletRaw
  const walletFullValue =
    effectiveWallet != null
      ? new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(effectiveWallet.unwrap())
      : null

  const totalCartItems = state.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const handleSearch = () => {
    if (!query.trim()) return
    emit(ProductAction.submitSearch(query))
  }

  return (
    <>
      {/* Transparent overlay — clicking outside the popup closes it */}
      {avatarMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => emit(closeAvatarMenu)}
        />
      )}

      <div className={styles.container}>
        {/* LEFT: logo + greeting side-by-side */}
        <div className={styles.left}>
          <Link
            route={toRoute("Home", {})}
            className={styles.logo}
          >
            <img
              className={styles.img}
              src={localImage.logo.unwrap()}
              alt="Logo"
            />
          </Link>
          <span className={styles.hiText}>Hi, {userName}!</span>
        </div>

        {/* CATEGORY */}
        <button
          className={styles.shopByCategoryBtn}
          onClick={() => emit(CategoryAction.toggleCategory(!isOpen))}
        >
          Shop by category
          <IoIosArrowDown
            size={13}
            className={css({
              marginTop: "1px",
              transition: "transform 0.3s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            })}
          />
        </button>

        {/* SEARCH */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchContainer}>
            <div className={styles.inputWrapper}>
              <InputText
                value={query}
                placeholder="Search for anything"
                onChange={(val) => emit(ProductAction.onChangeQuery(val))}
              />
            </div>
            <button
              className={styles.searchButton}
              onClick={handleSearch}
            >
              <IoMdSearch size={20} />
            </button>
          </div>
        </div>

        {/* RIGHT panel */}
        <div className={styles.menuItems}>
          {/* Icon buttons */}
          <div className={styles.utilityZone}>
            <div
              className={`${styles.iconItem} ${styles.cartIconItem}`}
              onClick={() => emit(CartAction.toggleCart(true))}
              title="Cart"
            >
              <IoMdCart size={20} />
              {totalCartItems > 0 && (
                <span className={styles.badge}>{totalCartItems}</span>
              )}
            </div>

            <div
              className={styles.iconItem}
              title="Notifications"
              onClick={() => {
                if (state._t !== "AuthUser") {
                  emit(
                    navigateTo(
                      toRoute("Login", { redirect: toPath(state.route) }),
                    ),
                  )
                }
              }}
            >
              <IoMdNotifications size={20} />
            </div>
          </div>

          <div className={styles.verticalDivider} />

          {state._t === "AuthUser" ? (
            <div className={styles.userIdentityRow}>
              {/* Wallet pill + hover card */}
              <div className={styles.walletContainer}>
                <div className={styles.walletPill}>
                  <span className={styles.coinBadge}>T</span>
                  <span className={styles.walletValue}>{walletBalance}</span>
                </div>
                <div className={`${styles.walletHoverCard} wallet-hover-card`}>
                  <span className={styles.walletHoverLabel}>Wallet</span>
                  <span className={styles.walletHoverValue}>
                    T {walletFullValue}
                  </span>
                </div>
              </div>

              {/* Avatar + controlled popup */}
              <div className={styles.avatarMenuContainer}>
                <button
                  className={styles.avatarButton}
                  title="Account menu"
                  onClick={() => emit(toggleAvatarMenu)}
                >
                  <span className={styles.avatarCircle}>{userInitial}</span>
                </button>

                {avatarMenuOpen && (
                  <div className={styles.avatarMenuCard}>
                    {/* User info header */}
                    <div className={styles.avatarMenuHeader}>
                      <span className={styles.avatarMenuHeaderAvatar}>
                        {userInitial}
                      </span>
                      <div className={styles.avatarMenuHeaderInfo}>
                        <span className={styles.avatarMenuHeaderName}>
                          {userName}
                        </span>
                        {walletFullValue != null && (
                          <span className={styles.avatarMenuHeaderWallet}>
                            T {walletFullValue}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.avatarMenuDivider} />

                    <Link
                      route={toRoute("Profile", {})}
                      className={styles.avatarMenuItem}
                      onClick={() => emit(closeAvatarMenu)}
                    >
                      Profile
                    </Link>

                    <Link
                      route={toRoute("UserOrders", {})}
                      className={styles.avatarMenuItem}
                      onClick={() => emit(closeAvatarMenu)}
                    >
                      Orders
                    </Link>

                    <Link
                      route={toRoute("WalletDeposit", {})}
                      className={`${styles.avatarMenuItem} ${styles.avatarMenuItemDeposit}`}
                      onClick={() => emit(closeAvatarMenu)}
                    >
                      Deposit
                    </Link>

                    <div className={styles.avatarMenuDivider} />

                    <Link
                      route={toRoute("Login", { redirect: null })}
                      className={`${styles.avatarMenuItem} ${styles.avatarMenuItemLogout}`}
                      onClick={() => {
                        emit(closeAvatarMenu)
                        emit(LoginAction.logout())
                      }}
                    >
                      Logout
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className={styles.authWrapper}>
            <div className={styles.actionGroup}>
              {state._t === "AuthUser" ? (
                <></>
              ) : (
                <>
                  <Link
                    route={toRoute("Login", { redirect: toPath(state.route) })}
                    className={styles.actionItem}
                  >
                    Login
                  </Link>
                  <span className={styles.separator}>or</span>
                  <Link
                    route={toRoute("Register", {})}
                    className={styles.actionItem}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  /* ---------- overlay ---------- */
  overlay: css({
    position: "fixed",
    inset: 0,
    zIndex: 29,
    background: "transparent",
  }),

  /* ---------- container ---------- */
  container: css({
    display: "flex",
    padding: `${theme.s2} ${theme.s4}`,
    gap: theme.s4,
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid rgba(124, 58, 237, 0.12)`,
    boxShadow:
      "0 2px 20px rgba(124, 58, 237, 0.08), 0 1px 3px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 30,
    /* rainbow top-bar */
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "3px",
      background:
        "linear-gradient(90deg, #7c3aed 0%, #a855f7 35%, #ec4899 65%, #f97316 100%)",
    },
  }),

  /* ---------- left: logo + greeting in a row ---------- */
  left: css({
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    gap: theme.s2,
  }),
  logo: css({
    display: "block",
    width: "auto",
    height: "40px",
    flexShrink: 0,
    textDecoration: "none",
    transition: "transform 0.25s ease, filter 0.25s ease",
    "&:hover": {
      transform: "translateY(-2px) scale(1.04)",
      filter: "drop-shadow(0 4px 12px rgba(124, 58, 237, 0.4))",
    },
  }),
  img: css({
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  }),
  hiText: css({
    ...font.medium12,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
    flexShrink: 0,
  }),

  /* ---------- category button ---------- */
  shopByCategoryBtn: css({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(124, 58, 237, 0.06)",
    border: `1.5px solid rgba(124, 58, 237, 0.2)`,
    borderRadius: theme.brFull,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.medium14,
    color: color.genz.purple,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.22s ease",
    "&:hover": {
      background: color.genz.gradientPurplePink,
      borderColor: "transparent",
      color: color.neutral0,
      transform: "translateY(-1px)",
      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.28)",
    },
  }),

  /* ---------- search ---------- */
  searchWrapper: css({
    flex: 1,
    display: "flex",
    justifyContent: "center",
    maxWidth: "800px",
  }),
  searchContainer: css({
    display: "flex",
    width: "100%",
    height: "42px",
    borderRadius: theme.brFull,
    border: `1.5px solid rgba(124, 58, 237, 0.25)`,
    overflow: "hidden",
    alignItems: "stretch",
    background: color.neutral0,
    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "&:focus-within": {
      borderColor: color.genz.purple,
      boxShadow: `0 0 0 3px rgba(124, 58, 237, 0.12), 0 2px 8px rgba(124, 58, 237, 0.15)`,
    },
  }),
  inputWrapper: css({
    flex: 1,
    height: "100%",
    display: "flex",
    "& > div": {
      width: "100%",
      height: "100%",
      border: "none !important",
      background: "transparent !important",
      borderRadius: "0 !important",
      padding: `0 ${theme.s2} !important`,
      boxShadow: "none !important",
    },
    "& input": {
      height: "100%",
      cursor: "text",
      ...font.medium14,
      color: color.genz.purple,
    },
  }),
  searchButton: css({
    width: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    transition: "filter 0.2s ease, transform 0.2s ease",
    "&:hover": {
      filter: "brightness(1.1)",
      transform: "scale(1.04)",
    },
  }),

  /* ---------- right panel ---------- */
  menuItems: css({
    display: "flex",
    gap: theme.s2,
    justifyContent: "flex-end",
    alignItems: "center",
    flexShrink: 0,
    padding: `${theme.s1} ${theme.s2}`,
    borderRadius: theme.br5,
    border: `1px solid rgba(124, 58, 237, 0.12)`,
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 1px 6px rgba(124, 58, 237, 0.06)",
  }),
  utilityZone: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  verticalDivider: css({
    width: "1px",
    alignSelf: "stretch",
    background: "rgba(124, 58, 237, 0.12)",
  }),

  /* ---------- icon buttons ---------- */
  iconItem: css({
    color: color.genz.purple,
    display: "flex",
    cursor: "pointer",
    position: "relative",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    alignItems: "center",
    justifyContent: "center",
    border: `1.5px solid rgba(124, 58, 237, 0.2)`,
    background: "rgba(124, 58, 237, 0.04)",
    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      background: color.genz.gradientPurplePink,
      borderColor: "transparent",
      color: color.neutral0,
      transform: "translateY(-2px) scale(1.07)",
      boxShadow: "0 5px 14px rgba(124, 58, 237, 0.3)",
    },
  }),
  cartIconItem: css({
    position: "relative",
    overflow: "visible",
  }),
  badge: css({
    position: "absolute",
    top: "-7px",
    right: "-7px",
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    fontSize: "10px",
    fontWeight: "bold",
    minWidth: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${color.neutral0}`,
    padding: "2px",
    lineHeight: 1,
    animation: `${glowPulse} 2s ease-in-out infinite`,
  }),

  /* ---------- authenticated user row ---------- */
  userIdentityRow: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  walletContainer: css({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    "&:hover .wallet-hover-card": {
      opacity: 1,
      transform: "translateY(0)",
      pointerEvents: "auto",
    },
  }),
  walletPill: css({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.s1,
    padding: `${theme.s1} ${theme.s2}`,
    borderRadius: theme.br5,
    background:
      "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)",
    border: `1.5px solid rgba(124, 58, 237, 0.2)`,
    boxShadow: "0 1px 4px rgba(124, 58, 237, 0.1)",
  }),
  coinBadge: css({
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.bold10,
    lineHeight: 1,
  }),
  walletValue: css({
    ...font.bold12,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1,
    cursor: "default",
  }),
  walletHoverCard: css({
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "140px",
    borderRadius: theme.br2,
    border: `1px solid rgba(124, 58, 237, 0.2)`,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 24px rgba(124, 58, 237, 0.15)",
    padding: `${theme.s2} ${theme.s3}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    zIndex: 32,
    opacity: 0,
    pointerEvents: "none",
    transform: "translateY(-6px)",
    transition: "opacity 0.16s ease, transform 0.16s ease",
  }),
  walletHoverLabel: css({
    ...font.regular12,
    color: color.neutral600,
  }),
  walletHoverValue: css({
    ...font.bold14,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1,
  }),

  /* ---------- avatar ---------- */
  avatarMenuContainer: css({
    position: "relative",
    display: "inline-flex",
    zIndex: 30,
  }),
  avatarButton: css({
    padding: 0,
    margin: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "inline-flex",
    outline: "none",
  }),
  avatarCircle: css({
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    border: `2px solid rgba(255,255,255,0.7)`,
    boxShadow: "0 2px 10px rgba(124, 58, 237, 0.35)",
    ...font.bold12,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px) scale(1.06)",
      boxShadow: "0 4px 18px rgba(124, 58, 237, 0.45)",
    },
  }),

  /* ---------- avatar popup card ---------- */
  avatarMenuCard: css({
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: "204px",
    borderRadius: "14px",
    border: `1.5px solid rgba(124, 58, 237, 0.15)`,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    backdropFilter: "blur(20px)",
    boxShadow:
      "0 16px 40px rgba(124, 58, 237, 0.16), 0 4px 12px rgba(0,0,0,0.07)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 31,
  }),
  avatarMenuHeader: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    padding: `${theme.s3} ${theme.s3}`,
    background:
      "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)",
  }),
  avatarMenuHeaderAvatar: css({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    ...font.bold14,
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.28)",
  }),
  avatarMenuHeaderInfo: css({
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  }),
  avatarMenuHeaderName: css({
    ...font.bold12,
    color: color.neutral900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  avatarMenuHeaderWallet: css({
    ...font.regular12,
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
  }),
  avatarMenuDivider: css({
    height: "1px",
    background: "rgba(124, 58, 237, 0.08)",
    margin: `${theme.s1} 0`,
  }),
  avatarMenuItem: css({
    textDecoration: "none",
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    color: color.neutral700,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition:
      "background 0.15s ease, color 0.15s ease, padding-left 0.15s ease",
    "&:hover": {
      background: "rgba(124, 58, 237, 0.06)",
      color: color.genz.purple,
      paddingLeft: `calc(${theme.s3} + 4px)`,
    },
  }),
  avatarMenuItemDeposit: css({
    color: color.genz.purple,
    fontWeight: 600,
    "&:hover": {
      background:
        "linear-gradient(90deg, rgba(124, 58, 237, 0.09) 0%, rgba(236, 72, 153, 0.06) 100%)",
      color: color.genz.pink,
    },
  }),
  avatarMenuItemLogout: css({
    color: "#ef4444",
    "&:hover": {
      background: "rgba(239, 68, 68, 0.06)",
      color: "#ef4444",
    },
  }),

  /* ---------- auth (guest) ---------- */
  actionItem: css({
    background: color.genz.gradientPurplePink,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textDecoration: "none",
    cursor: "pointer",
    ...font.bold14,
    transition: "opacity 0.2s ease, transform 0.2s ease",
    "&:hover": {
      opacity: 0.8,
      transform: "translateY(-1px)",
    },
  }),
  authWrapper: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "3px",
    lineHeight: 1.2,
    marginLeft: theme.s1,
  }),
  actionGroup: css({
    display: "flex",
    gap: theme.s1,
    alignItems: "center",
    minHeight: "16px",
  }),
  separator: css({
    color: color.neutral400,
    fontSize: "12px",
  }),
}
