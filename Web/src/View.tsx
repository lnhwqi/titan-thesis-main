import { JSX } from "react"
import { AuthState, State } from "./State"
import { LoadingLayout } from "./View/Layout/Loading"
import { EmptyLayout } from "./View/Layout/Empty"
import { AuthLayout } from "./View/Layout/Auth"
import { HomeLayout } from "./View/Layout/Home"
import ProfilePage from "./Page/Profile"
import NotFoundPage from "./Page/NotFound"
import LoginPage from "./Page/Login"
import HomePage from "./Page/Home"
import SearchPage from "./Page/Search"
import ProductDetailPage from "./Page/ProductDetail"

type Props = { state: State }
export default function View(props: Props): JSX.Element {
  const { state } = props
  if (state._t === "LoadingAuth") {
    return <LoadingLayout />
  }

  switch (state.route._t) {
    case "Home":
      return (
        <HomeLayout
          state={state}
          Page={HomePage}
        />
      )
    case "NotFound":
      return (
        <EmptyLayout
          state={state}
          Page={NotFoundPage}
        />
      )
    case "Login":
      return (
        <EmptyLayout
          state={state}
          Page={LoginPage}
        />
      )

    case "Search":
      return (
        <HomeLayout
          state={state}
          Page={SearchPage}
        />
      )
    case "ProductDetail":
      return (
        <HomeLayout
          state={state}
          Page={ProductDetailPage}
        />
      )

    case "Profile":
      return withAuthLayout(state, ProfilePage)
  }
}

function withAuthLayout(
  state: State,
  Page: React.FC<{ authState: AuthState }>,
): JSX.Element {
  return state._t !== "Auth" ? (
    <EmptyLayout
      state={state}
      Page={LoginPage}
    />
  ) : (
    <AuthLayout
      authState={state}
      Page={Page}
    />
  )
}
