import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { color } from "../Theme"
import Header from "./Header"
import SubHeader from "./SubHeader"
import CategorySidebar from "./Category"
import { CartSidebar } from "../Part/Cart"

type Props = {
  state: State
  Page: React.FC<{ state: State }>
}

export function HomeLayout(props: Props): JSX.Element {
  const { state, Page } = props
  const { isOpen } = state.category

  return (
    <div className={styles.container}>
      <Header state={state} />
      <SubHeader state={state} />

      <div className={styles.body}>
        <aside className={isOpen ? styles.sidebarOpen : styles.sidebarClosed}>
          <div className={styles.sidebarContent}>
            <CategorySidebar state={state} />
          </div>
        </aside>

        <main className={styles.mainContent}>
          <div className="Poster">
            <img
              src="/assets/poster.jpg"
              alt="Poster"
              className="PosterImage"
            />
            <div className="PosterOverlay">
              <h1 className="PosterTitle">Welcome to Our Store</h1>
              <p className="PosterSubtitle">
                Discover the best products at unbeatable prices.
              </p>
            </div>
          </div>

          <Page state={state} />
        </main>

        <aside
          className={!isOpen ? styles.adsSidebarOpen : styles.adsSidebarClosed}
        >
          <div className={styles.adsSidebarContent}></div>
        </aside>
      </div>

      <CartSidebar state={state} />
    </div>
  )
}

const styles = {
  container: css({
    width: "100%",
    maxWidth: "100%",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
  }),
  body: css({
    display: "flex",
    flex: 1,
    overflow: "hidden",
  }),

  sidebarOpen: css({
    width: "260px",
    flexShrink: 0,
    opacity: 1,
    visibility: "visible",
    borderRight: `1px solid ${color.secondary100}`,
    backgroundColor: color.neutral0,
    overflowY: "auto",
    transition: "width 0.28s ease, opacity 0.2s ease",
  }),

  sidebarClosed: css({
    width: "0px",
    flexShrink: 0,
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    overflow: "hidden",
    transition: "width 0.28s ease, opacity 0.2s ease",
  }),

  sidebarContent: css({
    width: "260px",
    transition: "opacity 0.2s ease",
  }),
  adsSidebarOpen: css({
    width: "260px",
    flexShrink: 0,
    opacity: 1,
    visibility: "visible",
    borderRight: `1px solid ${color.secondary100}`,
    backgroundColor: color.neutral0,
    overflowY: "auto",
    transition: "width 0.28s ease, opacity 0.2s ease",
  }),

  adsSidebarClosed: css({
    width: "0px",
    flexShrink: 0,
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    overflow: "hidden",
    transition: "width 0.28s ease, opacity 0.2s ease",
  }),

  adsSidebarContent: css({
    width: "260px",
    transition: "opacity 0.2s ease",
  }),
  mainContent: css({
    flex: 1,
    height: "100%",
    width: "calculate(100% - 260px)",
    overflowY: "auto",
    position: "relative",
    zIndex: 1,
    scrollbarWidth: "thin",
    scrollbarColor: `${color.primary500} transparent`,
    scrollBehavior: "smooth",
    scrollbarGutter: "stable",
    "&::-webkit-scrollbar": {
      width: "4px",
      height: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: color.primary500,
      borderRadius: "4px",
    },
  }),
}
