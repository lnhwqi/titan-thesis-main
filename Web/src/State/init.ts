import { Route } from "../Route"
import { AuthState, State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { initLoginState } from "./Login"
import { initProductState } from "./Product"
import { User } from "../../../Core/App/User"
import { initUpdateProfileState } from "./UpdateProfile"
import { initCategoryState } from "./Category"
import { initCartState } from "./Cart"
import { initRegisterState } from "./Register"
import { initAdminDashboardState } from "./AdminDashboard"
import { initAdminPosterState } from "./AdminPoster"
import { initSellerDashboardState } from "./SellerDashboard"
import { initVoucherState } from "./Voucher"
import { initPaymentState } from "./Payment"
import { initOrderPaymentState } from "./OrderPayment"

export function initState(route: Route): State {
  const token = AuthToken.get()
  return {
    _t: token == null ? "Public" : "LoadingAuth",
    route,
    login: initLoginState(),
    register: initRegisterState(),
    adminDashboard: initAdminDashboardState(),
    adminPoster: initAdminPosterState(),
    sellerDashboard: initSellerDashboardState(),
    voucher: initVoucherState(),
    payment: initPaymentState(),
    orderPayment: initOrderPaymentState(),
    product: initProductState(),
    category: initCategoryState(),
    cart: initCartState(),
  }
}

export function initAuthState(profile: User, state: State): AuthState {
  return {
    ...state,
    _t: "AuthUser",
    updateProfile: initUpdateProfileState(profile),
    profile,
  }
}
