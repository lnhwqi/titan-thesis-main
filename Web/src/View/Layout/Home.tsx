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
      <SubHeader />

      <div className={styles.body}>
        {/* SIDEBAR: Luôn nằm bên trái, co giãn mượt mà */}
        <aside className={isOpen ? styles.sidebarOpen : styles.sidebarClosed}>
          <div className={styles.sidebarContent}>
            <CategorySidebar state={state} />
          </div>
        </aside>

        {/* MAIN: Luôn cho phép tương tác với sản phẩm */}
        <main className={styles.mainContent}>
          {/* KHÔNG dùng Overlay ở đây nếu muốn tương tác với ProductCard */}
          <Page state={state} />
        </main>
      </div>

      <CartSidebar state={state} />
    </div>
  )
}

const styles = {
  container: css({
    width: "100dvw",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
  }),
  body: css({
    display: "flex",
    flex: 1,
    overflow: "hidden",
  }),

  sidebarOpen: css({
    width: "260px",
    opacity: 1,
    visibility: "visible",
    flexShrink: 0,
    borderRight: `1px solid ${color.secondary100}`,
    backgroundColor: color.neutral0,
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    overflowY: "auto",
  }),

  sidebarClosed: css({
    width: "0px",
    opacity: 0,
    visibility: "hidden", // Để chuột có thể đi xuyên qua khi đóng
    flexShrink: 0,
    borderRight: "0px solid transparent",
    pointerEvents: "none", // Vô hiệu hóa tương tác khi ẩn
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  }),

  sidebarContent: css({
    width: "260px", // Giữ nguyên độ rộng để nội dung không bị méo
  }),

  mainContent: css({
    flex: 1,
    overflowY: "auto",
    position: "relative",
    zIndex: 1, // Đảm bảo luôn nằm dưới Header nhưng có thể nhận event
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  }),
}
