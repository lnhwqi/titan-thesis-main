import { JSX } from "react"
import { AuthState, State } from "./State"
import { LoadingLayout } from "./View/Layout/Loading"
import { EmptyLayout } from "./View/Layout/Empty"
import { AuthLayout } from "./View/Layout/Auth"
import { HomeLayout } from "./View/Layout/Home"
import ProfilePage from "./Page/Profile"
import NotFoundPage from "./Page/NotFound"
import LoginPage from "./Page/Login"
import RegisterPage from "./Page/Register"
import AdminLoginPage from "./Page/AdminLogin"
import SellerLoginPage from "./Page/SellerLogin"
import AdminDashboardPage from "./Page/AdminDashboard"
import AdminCategoryManagementPage from "./Page/AdminCategoryManagement"
import SellerDashboardPage from "./Page/SellerDashboard"
import SellerProductCreatePage from "./Page/SellerProductCreate"
import SellerProductEditPage from "./Page/SellerProductEdit"
import SellerShippingPage from "./Page/SellerShipping"
import HomePage from "./Page/Home"
import SavedPage from "./Page/Saved"
import SearchPage from "./Page/Search"
import ProductDetailPage from "./Page/ProductDetail"
import SellerProfilePage from "./Page/SellerProfile"

type Props = { state: State }
export default function View(props: Props): JSX.Element {
  const { state } = props
  if (state._t === "LoadingAuth") {
    return <LoadingLayout />
  }

  switch (state.route._t) {
    case "Home":
    case "Category":
      return (
        <HomeLayout
          state={state}
          Page={HomePage}
        />
      )
    case "Saved":
      return (
        <HomeLayout
          state={state}
          Page={SavedPage}
        />
      )
    case "NotFound":
      return (
        <EmptyLayout
          state={state}
          Page={NotFoundPage}
        />
      )
    case "AdminLogin":
      return (
        <EmptyLayout
          state={state}
          Page={AdminLoginPage}
        />
      )
    case "SellerLogin":
      return (
        <EmptyLayout
          state={state}
          Page={SellerLoginPage}
        />
      )
    case "Register":
      return (
        <EmptyLayout
          state={state}
          Page={RegisterPage}
        />
      )
    case "AdminDashboard":
      return (
        <EmptyLayout
          state={state}
          Page={AdminDashboardPage}
        />
      )
    case "AdminCategoryManagement":
      return (
        <EmptyLayout
          state={state}
          Page={AdminCategoryManagementPage}
        />
      )
    case "SellerDashboard":
      return (
        <EmptyLayout
          state={state}
          Page={SellerDashboardPage}
        />
      )
    case "SellerProductCreate":
      return (
        <EmptyLayout
          state={state}
          Page={SellerProductCreatePage}
        />
      )
    case "SellerProductEdit":
      return (
        <EmptyLayout
          state={state}
          Page={SellerProductEditPage}
        />
      )
    case "SellerShipping":
      return (
        <EmptyLayout
          state={state}
          Page={SellerShippingPage}
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
    case "SellerProfile":
      return (
        <HomeLayout
          state={state}
          Page={SellerProfilePage}
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
  return state._t !== "AuthUser" ? (
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
