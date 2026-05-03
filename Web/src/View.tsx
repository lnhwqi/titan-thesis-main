import { JSX } from "react"
import { AuthState, State } from "./State"
import { LoadingLayout } from "./View/Layout/Loading"
import { EmptyLayout } from "./View/Layout/Empty"
import { AuthLayout } from "./View/Layout/Auth"
import { HomeLayout } from "./View/Layout/Home"
import { SubHome } from "./View/Layout/SubHome"
import ProfilePage from "./Page/Profile"
import NotFoundPage from "./Page/NotFound"
import LoginPage from "./Page/Login"
import RegisterPage from "./Page/Register"
import ProductListPage from "./Page/ProuductList"
import AdminLoginPage from "./Page/AdminLogin"
import SellerLoginPage from "./Page/SellerLogin"
import AdminDashboardPage from "./Page/AdminDashboard"
import AdminCategoryManagementPage from "./Page/AdminCategoryManagement"
import AdminPosterManagementPage from "./Page/AdminPosterManagement"
import AdminSellerModerationPage from "./Page/AdminSellerModeration"
import AdminSettingPage from "./Page/AdminSetting"
import AdminOrderManagementPage from "./Page/AdminOrderManagement"
import AdminSupportMonitoringPage from "./Page/AdminSupportMonitoring"
import AdminCoinRainPage from "./Page/AdminCoinRain"
import SellerDashboardPage from "./Page/SellerDashboard"
import SellerProductCreatePage from "./Page/SellerProductCreate"
import SellerProductEditPage from "./Page/SellerProductEdit"
import SellerShippingPage from "./Page/SellerShipping"
import SellerVoucherCreatePage from "./Page/SellerVoucherCreate"
import HomePage from "./Page/Home"
import SavedPage from "./Page/Saved"
import PaymentPage from "./Page/Payment"
import PaymentResultPage from "./Page/PaymentResult"
import WalletDepositPage from "./Page/WalletDeposit"
import UserOrdersPage from "./Page/UserOrders"
import SellerOrdersPage from "./Page/SellerOrders"
import UserReportsPage from "./Page/UserReports"
import UserReportCreatePage from "./Page/UserReportCreate"
import SellerReportsPage from "./Page/SellerReports"
import AdminReportsPage from "./Page/AdminReports"
import SearchPage from "./Page/Search"
import ProductDetailPage from "./Page/ProductDetail"
import SellerProfilePage from "./Page/SellerProfile"
import EventPosterPage from "./Page/EventPoster"
import CoinRainOverlay from "./View/CoinRainOverlay"

type Props = { state: State }
export default function View(props: Props): JSX.Element {
  const { state } = props
  if (state._t === "LoadingAuth") {
    return <LoadingLayout />
  }

  return (
    <>
      {routeView(state)}
      <CoinRainOverlay coinRain={state.coinRain} />
    </>
  )
}

function routeView(state: State): JSX.Element {
  switch (state.route._t) {
    case "Home":
      return (
        <HomeLayout
          state={state}
          Page={HomePage}
        />
      )
    case "Category":
      return (
        <SubHome
          state={state}
          Page={ProductListPage}
        />
      )
    case "Saved":
      return (
        <SubHome
          state={state}
          Page={SavedPage}
        />
      )
    case "Payment":
      return (
        <SubHome
          state={state}
          Page={PaymentPage}
        />
      )
    case "PaymentResult":
      return (
        <SubHome
          state={state}
          Page={PaymentResultPage}
        />
      )
    case "WalletDeposit":
      return (
        <SubHome
          state={state}
          Page={WalletDepositPage}
        />
      )
    case "UserOrders":
      return (
        <SubHome
          state={state}
          Page={UserOrdersPage}
        />
      )
    case "UserReports":
      return (
        <SubHome
          state={state}
          Page={UserReportsPage}
        />
      )
    case "UserReportCreate":
      return (
        <SubHome
          state={state}
          Page={UserReportCreatePage}
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
    case "AdminSellerModeration":
      return (
        <EmptyLayout
          state={state}
          Page={AdminSellerModerationPage}
        />
      )
    case "AdminCategoryManagement":
      return (
        <EmptyLayout
          state={state}
          Page={AdminCategoryManagementPage}
        />
      )
    case "AdminSetting":
      return (
        <EmptyLayout
          state={state}
          Page={AdminSettingPage}
        />
      )
    case "AdminPosterManagement":
      return (
        <EmptyLayout
          state={state}
          Page={AdminPosterManagementPage}
        />
      )
    case "AdminOrderManagement":
      return (
        <EmptyLayout
          state={state}
          Page={AdminOrderManagementPage}
        />
      )
    case "AdminSupportMonitoring":
      return (
        <EmptyLayout
          state={state}
          Page={AdminSupportMonitoringPage}
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
    case "SellerVoucherCreate":
      return (
        <EmptyLayout
          state={state}
          Page={SellerVoucherCreatePage}
        />
      )
    case "SellerOrders":
      return (
        <EmptyLayout
          state={state}
          Page={SellerOrdersPage}
        />
      )
    case "SellerReports":
      return (
        <EmptyLayout
          state={state}
          Page={SellerReportsPage}
        />
      )
    case "AdminReports":
      return (
        <EmptyLayout
          state={state}
          Page={AdminReportsPage}
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
        <SubHome
          state={state}
          Page={SearchPage}
        />
      )
    case "ProductDetail":
      return (
        <SubHome
          state={state}
          Page={ProductDetailPage}
        />
      )
    case "SellerProfile":
      return (
        <SubHome
          state={state}
          Page={SellerProfilePage}
        />
      )

    case "EventPoster":
      return (
        <SubHome
          state={state}
          Page={EventPosterPage}
        />
      )

    case "Profile":
      return withAuthLayout(state, ProfilePage)

    case "AdminCoinRain":
      return (
        <EmptyLayout
          state={state}
          Page={AdminCoinRainPage}
        />
      )
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
