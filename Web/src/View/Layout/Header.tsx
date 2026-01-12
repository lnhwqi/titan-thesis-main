import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { localImage } from "../ImageLocalSrc"
import Link from "../Link"
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as LoginAction from "../../Action/Login"
import { IoMdCart, IoMdNotifications, IoMdSearch } from "react-icons/io"

type Props = { state: State }
export default function (props: Props): JSX.Element {
  const { state } = props

  return (
    <div className={styles.container}>
      <Link
        route={toRoute("Home", {})}
        className={styles.logo}
      >
        <img
          className={styles.img}
          src={localImage.logo.unwrap()}
        />
      </Link>

      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            className={styles.searchInput}
            placeholder="Search for anything"
            // onChange={(e) => emit(SearchAction.onChangeQuery(e.target.value))}
          />
          <button className={styles.searchButton}>
            <IoMdSearch size={24} />
          </button>
        </div>
      </div>

      <div className={styles.menuItems}>
        <Link
          route={toRoute("Home", {})}
          className={
            state.route._t === "Home" ? styles.menuItemActive : styles.menuItem
          }
        >
          Home
        </Link>
        <Link
          route={toRoute("Profile", {})}
          className={
            state.route._t === "Profile"
              ? styles.menuItemActive
              : styles.menuItem
          }
        >
          Profile
        </Link>
        <Link
          route={toRoute("Profile", {})}
          className={styles.iconItem}
        >
          <IoMdCart size={32}></IoMdCart>
        </Link>
        <Link
          route={toRoute("Profile", {})}
          className={styles.iconItem}
        >
          <IoMdNotifications size={32}></IoMdNotifications>
        </Link>
        {state._t === "Auth" ? (
          <Link
            route={toRoute("Login", { redirect: null })}
            onClick={() => emit(LoginAction.logout())}
            className={styles.actionItem}
          >
            Logout
          </Link>
        ) : (
          <>
            <div className={styles.authWrapper}>
              <span className={styles.hiText}>Hi!</span>
              <div className={styles.actionGroup}>
                <Link
                  route={toRoute("Login", { redirect: null })}
                  className={styles.actionItem}
                >
                  Login
                </Link>
                <span className={styles.separator}>or</span>
                <Link
                  route={toRoute("Login", { redirect: null })}
                  className={styles.actionItem}
                >
                  Register
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    padding: theme.s4,
    gap: theme.s4,
    justifyContent: "space-between",
    alignItems: "center",
    background: color.secondary100,
  }),
  logo: css({
    display: "flex",
    width: "48px",
    height: "48px",
  }),
  img: css({
    width: "100%",
    height: "100%",
    display: "block",
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
    borderRadius: theme.br2,
    border: `2px solid ${color.secondary200}`,
    overflow: "hidden",
    transition: "all 0.2s",
    "&:focus-within": {
      borderColor: color.primary500,
    },
  }),
  searchInput: css({
    flex: 1,
    border: "none",
    padding: `0 ${theme.s4}`,
    outline: "none",
    ...font.regular14,
  }),
  searchButton: css({
    width: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.secondary500,
    color: color.neutral0,
    border: "none",
    cursor: "pointer",
    "&:hover": {
      background: color.primary500,
    },
  }),
  menuItems: css({
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    alignItems: "center",
  }),
  menuItem: css({
    ...font.medium14,
    color: color.secondary500,
    textDecoration: "none",
    padding: `${theme.s2} ${theme.s4}`,
    border: theme.s0,
    borderRadius: theme.br2,
    backgroundColor: color.neutral10,

    "&:hover": {
      color: color.neutral0,
      backgroundColor: color.secondary400,
      cursor: "pointer",
    },
  }),
  iconItem: css({
    color: color.secondary400,

    "&:hover": {
      color: color.primary500,
      cursor: "pointer",
    },
  }),
  menuItemActive: css({
    ...font.medium14,
    color: color.neutral0,
    textDecoration: "none",
    padding: `${theme.s2} ${theme.s4}`,
    border: theme.s0,
    backgroundColor: color.secondary500,
    cursor: "pointer",
    borderRadius: theme.br2,
  }),

  authWrapper: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
  }),

  // Style cho chữ Hi!
  hiText: css({
    ...font.regular12,
    color: color.neutral600,
  }),

  actionGroup: css({
    display: "flex",
    gap: "4px",
    alignItems: "center",
    ...font.medium14,
  }),

  actionItem: css({
    color: color.primary500,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  }),

  separator: css({
    color: color.neutral800,
    fontSize: "12px",
  }),
}
