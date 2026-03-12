import { User } from "../../Core/App/User"
import { LoginState } from "./State/Login"
import { ProductState } from "./State/Product"
import { CategoryState } from "./State/Category"
import { CartState } from "./State/Cart"
import { Route } from "./Route"
import { Action, Cmd } from "./Action"
import { UpdateProfileState } from "./State/UpdateProfile"

export type PublicState = {
  _t: "Public" | "LoadingAuth"
  route: Route
  login: LoginState
  product: ProductState
  category: CategoryState
  cart: CartState
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
