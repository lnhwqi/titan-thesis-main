import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { color, font } from "../Theme"
import { emit } from "../../Runtime/React"
import * as CategoryAction from "../../Action/Category"
import Header from "./Header"
import SubHeader from "./SubHeader"
import CategorySidebar from "../Part/Category"
import { CartSidebar } from "../Part/Cart"
import HomePoster from "../Part/HomePoster"

type Props = {
  state: State
  Page: React.FC<{ state: State }>
}

export function HomeLayout(props: Props): JSX.Element {
  const { state, Page } = props
  const { isOpen } = state.category

  const currentIndex = state.homePoster.currentIndex

  const closeCategory = () => {
    if (isOpen) {
      emit(CategoryAction.toggleCategory(false))
    }
  }

  return (
    <div className={styles.container}>
      <Header state={state} />
      <SubHeader state={state} />

      <div
        className={styles.body}
        onClick={closeCategory}
      >
        <aside
          className={isOpen ? styles.sidebarOpen : styles.sidebarClosed}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={styles.sidebarContent}>
            <CategorySidebar state={state} />
          </div>
        </aside>

        <aside
          className={
            !isOpen ? styles.posterSidebarOpen : styles.posterSidebarClosed
          }
          onClick={(event) => event.stopPropagation()}
        >
          <div className={styles.posterWrapper}>
            <div className={styles.posterCard}>
              <HomePoster state={state} />
            </div>
          </div>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.mainPoster}>
            <div className={styles.sliderWrapper(currentIndex)}>
              <HomePoster state={state} />
            </div>
          </div>

          <Page state={state} />
        </main>
      </div>

      <CartSidebar state={state} />
    </div>
  )
}

const styles = {
  container: css({
    width: "100%",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 1,
    backgroundColor: color.neutral0,
  }),

  body: css({
    display: "grid",
    gridTemplateColumns: "max-content max-content minmax(0, 1fr)",
    flex: 1,
  }),

  sidebarOpen: css({
    width: "260px",
    height: "calc(100vh - 82px)",
    position: "sticky",
    top: "82px",
    alignSelf: "start",
    opacity: 1,
    visibility: "visible",
    borderRight: `1px solid ${color.secondary100}`,
    backgroundColor: color.neutral0,
    overflow: "hidden",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
    willChange: "width, opacity",
  }),

  sidebarClosed: css({
    width: "0px",
    height: "100vh",
    position: "sticky",
    alignSelf: "start",
    top: 0,
    opacity: 0,
    visibility: "hidden",
    borderRight: "0px solid transparent",
    pointerEvents: "none",
    overflow: "hidden",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
    willChange: "width, opacity",
  }),

  sidebarContent: css({
    width: "260px",
    height: "100%",
    position: "sticky",
    top: 0,
    overflowY: "auto",
    "&::-webkit-scrollbar": { display: "none" },
  }),

  posterSidebarOpen: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    position: "sticky",
    alignSelf: "start",
    height: "calc(100vh - 82px)",
    top: "82px",
    width: "260px",
    opacity: 1,
    visibility: "visible",
    borderRight: `1px solid ${color.secondary100}`,
    backgroundColor: color.neutral0,
    overflow: "auto",
    scrollbarWidth: "none",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1) , opacity 0.3s ease",
    willChange: "width, opacity",
  }),

  posterSidebarClosed: css({
    width: "0px",
    height: "auto",
    opacity: 0,
    alignSelf: "start",
    visibility: "hidden",
    borderRight: "0px solid transparent",
    pointerEvents: "none",
    overflow: "hidden",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
    willChange: "width, opacity",
  }),

  posterWrapper: css({
    margin: "20px",
    width: "calc(100% - 40px)",
    height: "auto",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
  }),

  posterCard: css({
    width: "100%",
    height: "auto",
    borderRadius: "8px",

    "&& > section": {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      width: "100%",
    },

    "&& > section > article": {
      width: "100%",
      height: "100px",
      borderRadius: "8px",
    },

    "&& > section > article > div": {
      padding: "8px",
      gap: "4px",
    },

    "&& > section > article > div > span": {
      display: "none",
    },

    "&& > section > article > div > h1": css({
      ...font.bold12,
    }),

    "&& > section > article > div > p": css({
      ...font.regular10,
      margin: 0,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }),
  }),

  mainContent: css({
    height: "auto",
    padding: "0 10px",
    position: "relative",
  }),
  mainPoster: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20px",
  }),

  sliderWrapper: (index: number) =>
    css({
      width: "calc(360px * 16/9)",
      height: "360px",
      overflow: "hidden",
      position: "relative",
      margin: "20px 0px",

      "&& > section": {
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        width: "100%",
        fontSize: 0,
        transform: `translateX(calc(${index} * -100%))`,
        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        gap: "0px !important",
      },

      "&& > section > article": {
        fontSize: "initial",
        boxSizing: "border-box",
        minWidth: "100%",
        flex: "0 0 100%",
        margin: "0 !important",
      },
    }),
}
