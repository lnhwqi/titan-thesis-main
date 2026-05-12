import { User } from "../../Core/App/User"
import { Seller } from "../../Core/App/Seller"
import { Admin } from "../../Core/App/Admin"
import { Wallet } from "../../Core/App/User/Wallet"
import { LoginState } from "./State/Login"
import { ProductState } from "./State/Product"
import { CategoryState } from "./State/Category"
import { CartState } from "./State/Cart"
import { Route } from "./Route"
import { Action, Cmd } from "./Action"
import { UpdateProfileState } from "./State/UpdateProfile"
import { RegisterState } from "./State/Register"
import { AdminDashboardState } from "./State/AdminDashboard"
import { AdminPosterState } from "./State/AdminPoster"
import { HomePosterState } from "./State/HomePoster"
import { EventPosterState } from "./State/EventPoster"
import { SellerDashboardState } from "./State/SellerDashboard"
import { VoucherState } from "./State/Voucher"
import { PaymentState } from "./State/Payment"
import { OrderPaymentState } from "./State/OrderPayment"
import { ReportState } from "./State/Report"
import { ProductRatingReportState } from "./State/ProductRatingReport"
import { ProductRatingState } from "./State/ProductRating"
import { MessageState } from "./State/Message"
import { CoinRainState } from "./State/CoinRain"

type SharedSessionState = {
  route: Route
  login: LoginState
  register: RegisterState
  adminDashboard: AdminDashboardState
  adminPoster: AdminPosterState
  homePoster: HomePosterState
  eventPoster: EventPosterState
  sellerDashboard: SellerDashboardState
  voucher: VoucherState
  payment: PaymentState
  orderPayment: OrderPaymentState
  report: ReportState
  productRatingReport: ProductRatingReportState
  productRating: ProductRatingState
  product: ProductState
  category: CategoryState
  cart: CartState
  message: MessageState
  coinRain: CoinRainState
  userBalance: Wallet | null
  avatarMenuOpen: boolean
}

export type PublicOnlyState = SharedSessionState & {
  _t: "Public"
}

export type LoadingAuthState = SharedSessionState & {
  _t: "LoadingAuth"
}

export type PublicState = PublicOnlyState | LoadingAuthState

export type GuestState = PublicState

type SharedState = SharedSessionState

export type AuthUserState = SharedState & {
  _t: "AuthUser"
  profile: User
  updateProfile: UpdateProfileState
}

export type AuthSellerState = SharedState & {
  _t: "AuthSeller"
  profile: Seller
}

export type AuthAdminState = SharedState & {
  _t: "AuthAdmin"
  profile: Admin
}

export type AuthState = AuthUserState | AuthSellerState | AuthAdminState

export type State = GuestState | AuthState

// --- LENSES & HELPERS ---

export function _PublicState(
  state: State,
  publicState: Partial<SharedSessionState>,
): State {
  return { ...state, ...publicState }
}

export function isAuth(state: State): boolean {
  return (
    state._t === "AuthUser" ||
    state._t === "AuthSeller" ||
    state._t === "AuthAdmin"
  )
}

export function isAuthUser(state: State): boolean {
  return state._t === "AuthUser"
}

export function isSeller(state: State): boolean {
  return state._t === "AuthSeller"
}

export function isAdmin(state: State): boolean {
  return state._t === "AuthAdmin"
}

export function currentActorId(state: State): string | null {
  switch (state._t) {
    case "AuthUser":
    case "AuthSeller":
    case "AuthAdmin":
      return state.profile.id.unwrap()
    case "Public":
    case "LoadingAuth":
      return null
  }
}

export function _AuthState(fn: (authState: AuthState) => [State, Cmd]): Action {
  return (state: State) => {
    switch (state._t) {
      case "AuthUser":
      case "AuthSeller":
      case "AuthAdmin":
        return fn(state)
      case "Public":
      case "LoadingAuth":
        return [state, []]
    }
  }
}

export function _AuthUserState(
  fn: (userState: AuthUserState) => [State, Cmd],
): Action {
  return (state: State) => {
    if (state._t === "AuthUser") {
      return fn(state)
    }
    return [state, []]
  }
}

export function _AdminState(
  fn: (adminState: AuthAdminState) => [State, Cmd],
): Action {
  return (state: State) => {
    if (state._t === "AuthAdmin") {
      return fn(state)
    }
    return [state, []]
  }
}

export function _SellerState(
  fn: (sellerState: AuthSellerState) => [State, Cmd],
): Action {
  return (state: State) => {
    if (state._t === "AuthSeller") {
      return fn(state)
    }
    return [state, []]
  }
}

export function _MessageState(
  state: State,
  message: Partial<MessageState>,
): State {
  return { ...state, message: { ...state.message, ...message } }
}
