import { css } from "@emotion/css"
import { JSX } from "react"
import {
  IoIosArrowDown,
  IoMdCart,
  IoMdNotifications,
  IoMdSearch,
} from "react-icons/io"
import { State } from "../../State"
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

type Props = { state: State }

export default function Header(props: Props): JSX.Element {
  const { state } = props
  const { isOpen } = state.category
  const query = state.product.searchQuery

  const rawUserName =
    state._t === "AuthUser" ? state.profile.name.unwrap() : "Guest"
  const userName = rawUserName.trim().split(/\s+/).pop() ?? "Guest"
  const userInitial = userName.trim().charAt(0).toUpperCase() || "G"
  const walletRaw =
    state._t === "AuthUser" ? String(state.profile.wallet.unwrap()) : ""
  const walletBalance =
    walletRaw.length > 4 ? `${walletRaw.slice(0, 4)}...` : walletRaw
  const walletFullValue =
    state._t === "AuthUser"
      ? new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(state.profile.wallet.unwrap())
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
    <div className={styles.container}>
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
        <span className={styles.hiText}>Hi! {userName}</span>
      </div>

      <button
        className={styles.shopByCategoryBtn}
        onClick={() => emit(CategoryAction.toggleCategory(!isOpen))}
      >
        Shop by category
        <IoIosArrowDown
          size={14}
          className={css({
            marginTop: "2px",
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          })}
        />
      </button>

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
            <IoMdSearch size={24} />
          </button>
        </div>
      </div>

      <div className={styles.menuItems}>
        <div className={styles.utilityZone}>
          <div
            className={styles.iconItem}
            onClick={() => emit(CartAction.toggleCart(true))}
          >
            <IoMdCart size={28} />
            {totalCartItems > 0 && (
              <span className={styles.badge}>{totalCartItems}</span>
            )}
          </div>

          <div
            className={styles.iconItem}
            onClick={() => {
              if (state._t !== "AuthUser") {
                emit(
                  navigateTo(
                    toRoute("Login", {
                      redirect: toPath(state.route),
                    }),
                  ),
                )
              }
            }}
          >
            <IoMdNotifications size={28} />
          </div>
        </div>

        <div className={styles.verticalDivider} />

        {state._t === "AuthUser" ? (
          <div className={styles.userIdentityRow}>
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

            <details className={styles.avatarMenuContainer}>
              <summary
                className={styles.avatarButton}
                title="Open account menu"
              >
                <span className={styles.avatarCircle}>{userInitial}</span>
              </summary>

              <div className={`${styles.avatarMenuCard} avatar-menu-card`}>
                <Link
                  route={toRoute("Profile", {})}
                  className={styles.avatarMenuItem}
                >
                  Profile
                </Link>

                <Link
                  route={toRoute("Login", { redirect: null })}
                  className={styles.avatarMenuItem}
                  onClick={() => {
                    emit(LoginAction.logout())
                  }}
                >
                  Logout
                </Link>
              </div>
            </details>
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
  )
}

const styles = {
  container: css({
    display: "flex",
    padding: `${theme.s2} ${theme.s4}`,
    gap: theme.s4,
    justifyContent: "space-between",
    alignItems: "center",
    background: `linear-gradient(180deg, ${color.neutral0} 0%, ${color.secondary10} 100%)`,
    borderBottom: `1px solid ${color.secondary100}`,
    boxShadow: theme.elevation.xsmall,
    position: "sticky",
    top: 0,
    zIndex: 20,
  }),
  left: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: theme.s1,
  }),
  logo: css({
    display: "block",
    width: "auto",
    height: "48px",
    flexShrink: 0,
    textDecoration: "none",
    transition: "transform 0.2s ease",
    "&:hover": {
      transform: "translateY(-1px)",
    },
  }),
  img: css({
    width: "100%",
    height: "100%",
    objectFit: "contain",
    border: "1px solid transparent",
    display: "block",
  }),
  shopByCategoryBtn: css({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: color.secondary20,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.brFull,
    padding: `${theme.s1} ${theme.s3}`,
    ...font.regular14,
    color: color.secondary500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    "&:hover": {
      color: color.primary500,
      borderColor: color.primary200,
      background: color.neutral0,
    },
  }),
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
    border: `1px solid ${color.secondary200}`,
    overflow: "hidden",
    alignItems: "stretch",
    background: color.neutral0,
    boxShadow: theme.elevation.small,
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
      color: color.secondary500,
    },
  }),
  searchButton: css({
    width: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${color.primary500} 0%, ${color.primary400} 100%)`,
    color: color.neutral0,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    transition: "filter 0.2s ease",
    "&:hover": { filter: "brightness(0.94)" },
  }),
  menuItems: css({
    display: "flex",
    gap: theme.s2,
    justifyContent: "flex-end",
    alignItems: "center",
    flexShrink: 0,
    padding: `${theme.s1} ${theme.s2}`,
    borderRadius: theme.br5,
    border: `1px solid ${color.secondary100}`,
    background: color.neutral0,
    boxShadow: theme.elevation.xsmall,
  }),
  utilityZone: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
  }),
  verticalDivider: css({
    width: "1px",
    alignSelf: "stretch",
    background: color.secondary100,
  }),
  iconItem: css({
    color: color.secondary500,
    display: "flex",
    cursor: "pointer",
    position: "relative",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${color.secondary100}`,
    background: color.neutral0,
    transition: "all 0.2s ease",
    "&:hover": {
      color: color.primary500,
      borderColor: color.primary200,
      transform: "translateY(-1px)",
      boxShadow: theme.elevation.small,
    },
  }),
  badge: css({
    position: "absolute",
    top: "-6px",
    right: "-8px",
    backgroundColor: color.primary500,
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
  }),
  actionItem: css({
    color: color.primary500,
    textDecoration: "none",
    cursor: "pointer",
    ...font.bold14,
    transition: "opacity 0.2s ease",
    "&:hover": { opacity: 0.82 },
  }),
  authWrapper: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "3px",
    lineHeight: 1.2,
    marginLeft: theme.s1,
  }),
  userIdentityRow: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s2,
    marginBottom: theme.s1,
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
    background: `linear-gradient(135deg, ${color.secondary20} 0%, ${color.neutral0} 100%)`,
    border: `1px solid ${color.secondary200}`,
    boxShadow: theme.elevation.xsmall,
  }),
  coinBadge: css({
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: color.primary500,
    color: color.semantics.warning.yellow500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.bold10,
    lineHeight: 1,
  }),
  walletValue: css({
    ...font.bold12,
    color: color.primary500,
    lineHeight: 1,
    cursor: "default",
  }),
  walletHoverCard: css({
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "130px",
    borderRadius: theme.br2,
    border: `1px solid ${color.secondary200}`,
    backgroundColor: color.neutral0,
    boxShadow: theme.elevation.medium,
    padding: `${theme.s2} ${theme.s3}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
    zIndex: 30,
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
    color: color.primary500,
    lineHeight: 1,
  }),
  avatarMenuContainer: css({
    position: "relative",
    display: "inline-flex",
    "&[open] .avatar-menu-card": {
      opacity: 1,
      transform: "translateY(0)",
      pointerEvents: "auto",
    },
    "& > summary": {
      listStyle: "none",
    },
    "& > summary::-webkit-details-marker": {
      display: "none",
    },
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
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.secondary400} 100%)`,
    color: color.neutral0,
    border: `1px solid ${color.secondary200}`,
    ...font.bold12,
    transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: theme.elevation.medium,
      filter: "brightness(1.03)",
    },
  }),
  avatarMenuCard: css({
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "140px",
    borderRadius: theme.br2,
    border: `1px solid ${color.secondary200}`,
    backgroundColor: color.neutral0,
    boxShadow: theme.elevation.large,
    padding: `${theme.s1} 0`,
    display: "flex",
    flexDirection: "column",
    zIndex: 40,
    opacity: 0,
    pointerEvents: "none",
    transform: "translateY(-6px)",
    transition: "opacity 0.16s ease, transform 0.16s ease",
  }),
  avatarMenuItem: css({
    textDecoration: "none",
    padding: `${theme.s2} ${theme.s3}`,
    ...font.medium14,
    color: color.secondary500,
    transition: "background-color 0.18s ease, color 0.18s ease",
    "&:hover": {
      backgroundColor: color.secondary50,
      color: color.primary500,
    },
  }),
  hiText: css({
    ...font.medium12,
    color: color.secondary500,
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
