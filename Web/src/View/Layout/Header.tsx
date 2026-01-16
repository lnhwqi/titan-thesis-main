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
import { toRoute } from "../../Route"
import { color, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as LoginAction from "../../Action/Login"
import * as ProductAction from "../../Action/Product"
import InputText from "../../View/Form/InputText"

type Props = { state: State }

export default function Header(props: Props): JSX.Element {
  const { state } = props
  const query = state.product.searchQuery

  const handleSearch = () => {
    if (!query.trim()) return
    emit(ProductAction.submitSearch(query))
  }

  return (
    <div className={styles.container}>
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

      <button className={styles.shopByCategoryBtn}>
        Shop by category
        <IoIosArrowDown
          size={14}
          style={{ marginTop: "2px" }}
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

        <div className={styles.iconItem}>
          <IoMdCart size={28} />
        </div>
        <div className={styles.iconItem}>
          <IoMdNotifications size={28} />
        </div>

        {state._t === "Auth" ? (
          <Link
            route={toRoute("Login", { redirect: null })}
            onClick={() => emit(LoginAction.logout())}
            className={styles.actionItem}
          >
            Logout
          </Link>
        ) : (
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
        )}
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
    background: color.neutral0,
    borderBottom: `1px solid ${color.secondary100}`,
  }),
  logo: css({
    display: "flex",
    width: "120px",
    height: "48px",
    flexShrink: 0,
    textDecoration: "none",
  }),
  img: css({
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  }),
  shopByCategoryBtn: css({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "transparent",
    border: "none",
    ...font.regular14,
    color: color.neutral600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    "&:hover": {
      color: color.primary500,
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
    borderRadius: theme.br2,
    border: `2px solid ${color.secondary500}`,
    overflow: "hidden",
    alignItems: "stretch",
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
    },
  }),
  searchButton: css({
    width: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.primary500,
    color: color.neutral0,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    "&:hover": {
      background: color.primary500,
    },
  }),
  menuItems: css({
    display: "flex",
    gap: "16px",
    justifyContent: "flex-end",
    alignItems: "center",
    flexShrink: 0,
  }),
  menuItem: css({
    ...font.medium14,
    color: color.secondary500,
    textDecoration: "none",
    "&:hover": { color: color.primary500 },
  }),
  menuItemActive: css({
    ...font.medium14,
    color: color.primary500,
    textDecoration: "none",
  }),
  iconItem: css({
    color: color.secondary400,
    display: "flex",
    cursor: "pointer",
    "&:hover": {
      color: color.primary500,
    },
  }),
  actionItem: css({
    color: color.primary500,
    textDecoration: "none",
    cursor: "pointer",
    "&:hover": {
      textDecoration: "underline",
    },
  }),
  authWrapper: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0px",
    lineHeight: 1.2,
  }),
  hiText: css({
    ...font.regular12,
    color: color.neutral600,
  }),
  actionGroup: css({
    display: "flex",
    gap: "4px",
    alignItems: "center",
    ...font.bold14,
  }),
  separator: css({
    color: color.neutral400,
    fontSize: "12px",
  }),
}
