import { User } from "../../Core/App/User"
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
import { SellerDashboardState } from "./State/SellerDashboard"
import { VoucherState } from "./State/Voucher"
import { PaymentState } from "./State/Payment"
import { OrderPaymentState } from "./State/OrderPayment"
import { ReportState } from "./State/Report"
import { ProductRatingReportState } from "./State/ProductRatingReport"
import { ProductRatingState } from "./State/ProductRating"
import { MessageState } from "./State/Message"
import { CoinRainState } from "./State/CoinRain"

export type PublicState = {
  _t: "Public" | "LoadingAuth"
  route: Route
  login: LoginState
  register: RegisterState
  adminDashboard: AdminDashboardState
  adminPoster: AdminPosterState
  homePoster: HomePosterState
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
}

type BaseAuthState = Omit<PublicState, "_t"> & {
  profile: User
  updateProfile: UpdateProfileState
}

export type AuthUserState = BaseAuthState & {
  _t: "AuthUser"
}

export type AuthSellerState = BaseAuthState & {
  _t: "AuthSeller"
}

export type AuthAdminState = BaseAuthState & {
  _t: "AuthAdmin"
}

export type AuthState = AuthUserState | AuthSellerState | AuthAdminState

export type State = PublicState | AuthState

// --- LENSES & HELPERS ---

export function _PublicState(
  state: State,
  publicState: Partial<PublicState>,
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

export function _AuthState(fn: (authState: AuthState) => [State, Cmd]): Action {
  return (state: State) => {
    if (
      state._t === "AuthUser" ||
      state._t === "AuthSeller" ||
      state._t === "AuthAdmin"
    ) {
      return fn(state)
    }
    return [state, []]
  }
}

export function _AdminState(
  fn: (adminState: AuthAdminState) => [State, Cmd],
): Action {
  return (state: State) => (state._t === "AuthAdmin" ? fn(state) : [state, []])
}

export function _SellerState(
  fn: (sellerState: AuthSellerState) => [State, Cmd],
): Action {
  return (state: State) => (state._t === "AuthSeller" ? fn(state) : [state, []])
}

export function _MessageState(
  state: State,
  message: Partial<MessageState>,
): State {
  return { ...state, message: { ...state.message, ...message } }
}
