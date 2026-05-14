import { css } from "@emotion/css"
import { State } from "../../State"
import { JSX } from "react"
import { appThemeClass, font, theme } from "../Theme"
import { emit } from "../../Runtime/React"
import * as CategoryAction from "../../Action/Category"
import * as HomePosterAction from "../../Action/HomePoster"
import Header from "./Header"
import SubHeader from "./SubHeader"
import Footer from "./Footer"
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
    <div className={`${appThemeClass} ${styles.container}`}>
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
            {state.homePoster.posters.length > 1 && (
              <div className={styles.sliderDots}>
                {state.homePoster.posters.map((_poster, i) => (
                  <button
                    key={i}
                    className={
                      i === currentIndex
                        ? styles.sliderDotActive
                        : styles.sliderDot
                    }
                    onClick={() => emit(HomePosterAction.goToPoster(i))}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <Page state={state} />
        </main>
      </div>

      <Footer state={state} />

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
    background:
      "linear-gradient(180deg, var(--app-brand-20) 0%, transparent 220px)",
  }),

  body: css({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    flex: 1,
    minHeight: 0,
    position: "relative",
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "max-content minmax(0, 1fr)",
    },
    "@media (min-width: 1280px)": {
      gridTemplateColumns: "max-content max-content minmax(0, 1fr)",
    },
  }),

  sidebarOpen: css({
    width: "min(86vw, 300px)",
    height: "calc(100dvh - 74px)",
    position: "fixed",
    left: 0,
    top: "74px",
    alignSelf: "start",
    opacity: 1,
    visibility: "visible",
    borderRight: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface-strong)",
    backdropFilter: "blur(18px)",
    boxShadow: "var(--app-shadow-sm)",
    overflow: "hidden",
    zIndex: 1200,
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
    willChange: "width, opacity",
    "@media (min-width: 1024px)": {
      width: "260px",
      height: "calc(100dvh - 82px)",
      position: "sticky",
      left: "auto",
      top: "82px",
      boxShadow: "none",
      zIndex: 2,
    },
  }),

  sidebarClosed: css({
    width: "0px",
    height: "calc(100dvh - 74px)",
    position: "fixed",
    alignSelf: "start",
    left: 0,
    top: "74px",
    opacity: 0,
    visibility: "hidden",
    borderRight: "0px solid transparent",
    pointerEvents: "none",
    overflow: "hidden",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
    willChange: "width, opacity",
    "@media (min-width: 1024px)": {
      height: "calc(100dvh - 82px)",
      position: "sticky",
      left: "auto",
      top: "82px",
    },
  }),

  sidebarContent: css({
    width: "min(86vw, 300px)",
    height: "100%",
    position: "sticky",
    top: 0,
    overflowY: "auto",
    "&::-webkit-scrollbar": { display: "none" },
    "@media (min-width: 1024px)": {
      width: "260px",
    },
  }),

  posterSidebarOpen: css({
    display: "none",
    "@media (min-width: 1280px)": {
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      position: "sticky",
      alignSelf: "start",
      height: "calc(100dvh - 82px)",
      top: "82px",
      width: "260px",
      opacity: 1,
      visibility: "visible",
      borderRight: "1px solid var(--app-border)",
      backgroundColor: "var(--app-surface)",
      backdropFilter: "blur(18px)",
      overflow: "auto",
      scrollbarWidth: "none",
      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1) , opacity 0.3s ease",
      willChange: "width, opacity",
    },
  }),

  posterSidebarClosed: css({
    display: "none",
    "@media (min-width: 1280px)": {
      display: "block",
      width: "0px",
      height: "calc(100dvh - 82px)",
      opacity: 0,
      alignSelf: "start",
      position: "sticky",
      top: "82px",
      visibility: "hidden",
      borderRight: "0px solid transparent",
      pointerEvents: "none",
      overflow: "hidden",
      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
      willChange: "width, opacity",
    },
  }),

  posterWrapper: css({
    margin: theme.s4,
    width: `calc(100% - ${theme.s8})`,
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
    borderRadius: theme.br3,
    overflow: "hidden",
    boxShadow: theme.elevation.small,

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
    padding: `clamp(12px, 2.5vw, 24px) clamp(12px, 2.8vw, 28px) ${theme.s6}`,
    position: "relative",
    minWidth: 0,
    background:
      "linear-gradient(180deg, var(--app-brand-20) 0%, transparent 160px)",
  }),
  mainPoster: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: theme.s5,
  }),

  sliderDots: css({
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    justifyContent: "center",
    alignItems: "center",
  }),

  sliderDot: css({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "var(--app-brand-200)",
    padding: 0,
    cursor: "pointer",
    transition: "all 0.25s ease",
    flexShrink: 0,
    "&:hover": {
      backgroundColor: "var(--app-brand-400)",
      transform: "scale(1.2)",
    },
  }),

  sliderDotActive: css({
    width: "24px",
    height: "8px",
    borderRadius: "4px",
    border: "none",
    background:
      "linear-gradient(90deg, var(--app-brand-500) 0%, var(--app-secondary-500) 100%)",
    padding: 0,
    cursor: "pointer",
    transition: "all 0.25s ease",
    flexShrink: 0,
  }),

  sliderWrapper: (index: number) =>
    css({
      width: "min(100%, 760px)",
      aspectRatio: "16 / 9",
      height: "auto",
      maxHeight: "420px",
      overflow: "hidden",
      position: "relative",
      margin: "8px 0 18px",
      borderRadius: theme.br3,
      border: "1px solid var(--app-border)",
      boxShadow: "var(--app-shadow-sm)",
      backgroundColor: "var(--app-surface-strong)",

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
        height: "100%",
        margin: "0 !important",
      },
    }),
}
