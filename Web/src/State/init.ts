import { Route } from "../Route"
import { AuthAdminState, AuthSellerState, AuthUserState, State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { initLoginState } from "./Login"
import { initProductState } from "./Product"
import { User } from "../../../Core/App/User"
import { Seller } from "../../../Core/App/Seller"
import { Admin } from "../../../Core/App/Admin"
import { initUpdateProfileState } from "./UpdateProfile"
import { initCategoryState } from "./Category"
import { initCartState } from "./Cart"
import { initRegisterState } from "./Register"
import { initAdminDashboardState } from "./AdminDashboard"
import { initAdminPosterState } from "./AdminPoster"
import { initHomePosterState } from "./HomePoster"
import { initEventPosterState } from "./EventPoster"
import { initSellerDashboardState } from "./SellerDashboard"
import { initVoucherState } from "./Voucher"
import { initPaymentState } from "./Payment"
import { initOrderPaymentState } from "./OrderPayment"
import { initReportState } from "./Report"
import { initProductRatingReportState } from "./ProductRatingReport"
import { initProductRatingState } from "./ProductRating"
import { initMessageState } from "./Message"
import { initialCoinRainState } from "./CoinRain"

export function initState(route: Route): State {
  const token = AuthToken.get()
  return {
    _t: token == null ? "Public" : "LoadingAuth",
    route,
    login: initLoginState(),
    register: initRegisterState(),
    adminDashboard: initAdminDashboardState(),
    adminPoster: initAdminPosterState(),
    homePoster: initHomePosterState(),
    eventPoster: initEventPosterState(),
    sellerDashboard: initSellerDashboardState(),
    voucher: initVoucherState(),
    payment: initPaymentState(),
    orderPayment: initOrderPaymentState(),
    report: initReportState(),
    productRatingReport: initProductRatingReportState(),
    productRating: initProductRatingState(),
    product: initProductState(),
    category: initCategoryState(),
    cart: initCartState(),
    message: initMessageState(),
    coinRain: initialCoinRainState,
    userBalance: null,
    avatarMenuOpen: false,
  }
}

export function initAuthUserState(profile: User, state: State): AuthUserState {
  return {
    ...state,
    _t: "AuthUser",
    updateProfile: initUpdateProfileState(profile),
    profile,
  }
}

export function initAuthSellerState(
  profile: Seller,
  state: State,
): AuthSellerState {
  return {
    ...state,
    _t: "AuthSeller",
    profile,
  }
}

export function initAuthAdminState(
  profile: Admin,
  state: State,
): AuthAdminState {
  return {
    ...state,
    _t: "AuthAdmin",
    profile,
  }
}
