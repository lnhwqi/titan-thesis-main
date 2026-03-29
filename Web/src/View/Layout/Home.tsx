import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { color } from "../Theme"
import { emit } from "../../Runtime/React"
import * as CategoryAction from "../../Action/Category"
import Header from "./Header"
import SubHeader from "./SubHeader"
import CategorySidebar from "./Category"
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
          className={!isOpen ? styles.sidebarOpen : styles.sidebarClosed}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={styles.posterWrapper}>
            <HomePoster state={state} />
          </div>
        </aside>

        <main className={styles.mainContent}>
          {/* 2. Truyền trực tiếp currentIndex vào hàm của Emotion, 
                 Không cần inline style, không cần dùng 'as' */}
          <div className={styles.sliderWrapper(currentIndex)}>
            <HomePoster state={state} />
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
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
    backgroundColor: color.neutral0,
  }),

  body: css({
    display: "grid",
    gridTemplateColumns: "max-content max-content minmax(0, 1fr)",
    flex: 1,
    height: "100%",
    overflow: "hidden",
  }),

  sidebarOpen: css({
    width: "260px",
    height: "100%",
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
    height: "100%",
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
    overflowY: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
  }),

  posterWrapper: css({
    width: "260px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }),

  mainContent: css({
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0 10px",
    position: "relative",

    scrollbarWidth: "thin",
    scrollbarColor: `${color.primary500} transparent`,
    scrollBehavior: "smooth",
    scrollbarGutter: "stable",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: color.primary500,
      borderRadius: "6px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
  }),

  sliderWrapper: (index: number) =>
    css({
      width: "100%",
      height: "280px",
      overflow: "hidden",
      position: "relative",
      marginBottom: "20px",

      "&& > section": {
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        width: "100%",

        transform: `translateX(calc(${index} * -100%))`,
        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        gap: 0,
      },

      "&& > section > article": {
        minWidth: "100%",
        flex: "0 0 100%",
      },
    }),
}
