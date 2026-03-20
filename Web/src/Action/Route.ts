import { cmd, type Cmd } from "../Action"
import { parseRoute } from "../Route"
import { _AuthState, _PublicState, State } from "../State"

import * as ProfileAction from "./Profile"
import * as ProductAction from "./Product"
import * as AdminDashboardAction from "./AdminDashboard"
import * as SellerDashboardAction from "./SellerDashboard"
import * as VoucherAction from "./Voucher"
import { parseProductID } from "../../../Core/App/Product/ProductID"
import { categoryIDDecoder } from "../../../Core/App/Category/CategoryID"
import { sellerIDDecoder } from "../../../Core/App/Seller/SellerID"

export function onUrlChange(s: State): [State, Cmd] {
  const route = parseRoute(window.location.href)
  const state = _PublicState(s, { route })

  switch (route._t) {
    case "Home":
      return ProductAction.loadWishlist()(state)

    case "Category":
      try {
        return ProductAction.selectCategoryFromRoute(
          categoryIDDecoder.verify(route.params.id),
        )(state)
      } catch (_e) {
        return [state, cmd()]
      }

    case "Saved":
      return ProductAction.loadWishlist()(state)

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

    case "AdminDashboard":
      return AdminDashboardAction.onEnterRoute(state)

    case "AdminCategoryManagement":
      return AdminDashboardAction.onEnterCategoryManagementRoute(state)

    case "Profile":
      return _AuthState(ProfileAction.onEnterRoute)(state)

    case "ProductDetail":
      try {
        const id = parseProductID(route.params.id)
        return ProductAction.loadDetail(id)(state)
      } catch (_e) {
        return [state, cmd()]
      }

    case "SellerProfile":
      try {
        const sellerID = sellerIDDecoder.verify(route.params.id)
        return ProductAction.loadSellerProfile(sellerID)(state)
      } catch (_e) {
        return [state, cmd()]
      }

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
        return [state, cmd()]
      }

      if (!query) {
        return ProductAction.loadList()(state)
      }

      return ProductAction.search(query)(state)
    }
  }
}
