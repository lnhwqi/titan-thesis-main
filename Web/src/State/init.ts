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

export function initState(route: Route): State {
  const token = AuthToken.get()
  return {
    _t: token == null ? "Public" : "LoadingAuth",
    route,
    login: initLoginState(),
    register: initRegisterState(),
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
