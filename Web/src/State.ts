import { User } from "../../Core/App/User"
import { LoginState } from "./State/Login"
import { ProductState } from "./State/ProductList"
import { SearchState } from "./State/Search"
import { Route } from "./Route"
import { Action, Cmd } from "./Action"
import { UpdateProfileState } from "./State/UpdateProfile"

export type State = PublicState | AuthState

export type PublicState = {
  _t: "Public" | "LoadingAuth"
  route: Route
  login: LoginState
  product: ProductState
  search: SearchState
}

export type AuthState = Omit<PublicState, "_t"> & {
  _t: "Auth"
  profile: User
  updateProfile: UpdateProfileState
}

// Lenses
export function _PublicState(
  state: State,
  publicState: Partial<PublicState>,
): State {
  return { ...state, ...publicState }
}

export function _AuthState(fn: (authState: AuthState) => [State, Cmd]): Action {
  return (state: State) => (state._t === "Auth" ? fn(state) : [state, []])
}
