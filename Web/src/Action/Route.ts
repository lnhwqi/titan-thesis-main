import { cmd, type Cmd } from "../Action"
import { parseRoute } from "../Route"
import { _AuthState, _PublicState, State } from "../State"

import * as ProfileAction from "./Profile"
import * as ProductAction from "./Product"
import * as HomePosterAction from "./HomePoster"
import * as EventPosterAction from "./EventPoster"
import * as AdminDashboardAction from "./Admin"
import * as AdminPosterAction from "./AdminPoster"
import * as SellerDashboardAction from "./SellerDashboard"
import * as VoucherAction from "./Voucher"
import * as PaymentAction from "./Payment"
import * as OrderPaymentAction from "./OrderPayment"
import * as ReportAction from "./Report"
import { parseProductID } from "../../../Core/App/Product/ProductID"
import { categoryIDDecoder } from "../../../Core/App/Category/CategoryID"
import { sellerIDDecoder } from "../../../Core/App/Seller/SellerID"

export function onUrlChange(s: State): [State, Cmd] {
  const route = parseRoute(window.location.href)
  const state = _PublicState(s, { route })

  HomePosterAction.stopAutoPlay()

  switch (route._t) {
    case "Home":
      return withHomePoster(ProductAction.loadWishlist()(state))

    case "Category":
      try {
        return withHomePoster(
          ProductAction.selectCategoryFromRoute(
            categoryIDDecoder.verify(route.params.id),
          )(state),
        )
      } catch (_e) {
        return withHomePoster([state, cmd()])
      }

    case "Saved":
      return withHomePoster(ProductAction.loadWishlist()(state))

    case "Payment":
      return withHomePoster(PaymentAction.onEnterRoute()(state))

    case "PaymentResult":
      return withHomePoster([state, cmd()])

    case "WalletDeposit":
      return withHomePoster([state, cmd()])

    case "UserOrders": {
      const [nextState, orderCmd] =
        OrderPaymentAction.onEnterUserOrdersRoute()(state)
      const [reportState, reportCmd] =
        ReportAction.onEnterUserReportsRoute()(nextState)
      return withHomePoster([reportState, [...orderCmd, ...reportCmd]])
    }

    case "UserReports":
      return withHomePoster(ReportAction.onEnterUserReportsRoute()(state))

    case "UserReportCreate":
      return withHomePoster(ReportAction.resetCreateDraft()(state))

    case "SellerOrders": {
      const [nextState, orderCmd] =
        OrderPaymentAction.onEnterSellerOrdersRoute()(state)
      const [reportState, reportCmd] =
        ReportAction.onEnterSellerReportsRoute()(nextState)
      return [reportState, [...orderCmd, ...reportCmd]]
    }

    case "SellerReports":
      return ReportAction.onEnterSellerReportsRoute()(state)

    case "AdminReports":
      return ReportAction.onEnterAdminReportsRoute()(state)

    case "AdminLogin":
    case "SellerLogin":
      return [state, cmd()]

    case "SellerDashboard":
      return SellerDashboardAction.onEnterRoute()(state)

    case "SellerProductCreate":
      return SellerDashboardAction.onEnterRoute()(state)

    case "SellerShipping":
      return SellerDashboardAction.onEnterRoute()(state)

    case "SellerVoucherCreate":
      return VoucherAction.onEnterCreateRoute()(state)

    case "SellerProductEdit":
      try {
        return SellerDashboardAction.onEnterEditRoute(
          parseProductID(route.params.id),
        )(state)
      } catch (_e) {
        return [state, cmd()]
      }

    case "Register":
    case "Login":
    case "NotFound":
      return [state, cmd()]

    case "AdminOrderManagement":
    case "AdminSetting":
    case "AdminSellerModeration":
    case "AdminSupportMonitoring":
    case "AdminCoinRain":
    case "AdminDashboard":
      return AdminDashboardAction.onEnterRoute(state)

    case "AdminCategoryManagement":
      return AdminDashboardAction.onEnterCategoryManagementRoute(state)

    case "AdminPosterManagement":
      return AdminPosterAction.onEnterRoute()(state)

    case "Profile":
      return _AuthState(ProfileAction.onEnterRoute)(state)

    case "ProductDetail":
      try {
        const id = parseProductID(route.params.id)
        return withHomePoster(ProductAction.loadDetail(id)(state))
      } catch (_e) {
        return withHomePoster([state, cmd()])
      }

    case "SellerProfile":
      try {
        const sellerID = sellerIDDecoder.verify(route.params.id)
        return withHomePoster(ProductAction.loadSellerProfile(sellerID)(state))
      } catch (_e) {
        return withHomePoster([state, cmd()])
      }

    case "EventPoster":
      return withHomePoster(
        EventPosterAction.onEnterRoute(route.params.id)(state),
      )

    case "Search": {
      const rawName = route.params.name
      let query = ""

      if (typeof rawName === "string") {
        query = rawName
      } else if (rawName !== null && typeof rawName === "object") {
        const json = JSON.parse(JSON.stringify(rawName))
        if (json.value && typeof json.value === "string") {
          query = json.value
        }
      }

      query = decodeURIComponent(query || "").trim()

      const { searchQuery, listResponse } = state.product
      const isAlreadyLoading =
        listResponse._t === "Loading" || listResponse._t === "Success"

      if (searchQuery === query && isAlreadyLoading) {
        return withHomePoster([state, cmd()])
      }

      if (!query) {
        return withHomePoster(ProductAction.loadList()(state))
      }

      return withHomePoster(ProductAction.search(query)(state))
    }
  }
}

function withHomePoster(next: [State, Cmd]): [State, Cmd] {
  HomePosterAction.startAutoPlay()
  const [nextState, existingCmd] = next
  const [posterState, posterCmd] = HomePosterAction.load()(nextState)
  return [posterState, [...existingCmd, ...posterCmd]]
}
