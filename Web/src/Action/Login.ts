import { Action, cmd, perform } from "../Action"
import { _LoginState } from "../State/Login"
import * as LoginApi from "../Api/Public/LoginUser"
import * as LoginSellerApi from "../Api/Public/LoginSeller"
import * as LoginAdminApi from "../Api/Public/LoginAdmin"
import * as LogoutApi from "../Api/Auth/User/Logout"
import { ApiError } from "../Api"
import * as RD from "../../../Core/Data/RemoteData"
import * as AuthToken from "../App/AuthToken"
import { toRoute, goBack, navigateTo } from "../Route"
import {
  initAuthAdminState,
  initAuthSellerState,
  initAuthUserState,
  initState,
} from "../State/init"
import * as FieldString from "../../../Core/Data/Form/FieldString"
import { reconnectAuthenticated, reconnectGuest } from "../Subscription"

export function onChangeEmail(value: string): Action {
  return (state) => {
    const { email } = state.login
    return [
      _LoginState(state, { email: FieldString.changeAndParse(value, email) }),
      cmd(),
    ]
  }
}

export function onChangePassword(value: string): Action {
  return (state) => {
    const { password } = state.login
    return [
      _LoginState(state, {
        password: FieldString.changeAndParse(value, password),
      }),
      cmd(),
    ]
  }
}

export function logout(): Action {
  return (state) => {
    return [state, cmd(LogoutApi.call().then(AuthToken.remove).then(onLogout))]
  }
}

function onLogout(): Action {
  return (_state) => {
    reconnectGuest()
    return [initState(toRoute("Login", { redirect: null })), cmd()]
  }
}

export function onSubmit(params: LoginApi.BodyParams): Action {
  return (state) => {
    return [
      _LoginState(state, { loginResponse: RD.loading() }),
      cmd(LoginApi.call(params).then(onSubmitResponse)),
    ]
  }
}

export function onSubmitSeller(params: LoginSellerApi.BodyParams): Action {
  return (state) => {
    return [
      _LoginState(state, { loginResponse: RD.loading() }),
      cmd(LoginSellerApi.call(params).then(onSubmitSellerResponse)),
    ]
  }
}

export function onSubmitAdmin(params: LoginAdminApi.BodyParams): Action {
  return (state) => {
    return [
      _LoginState(state, { loginResponse: RD.loading() }),
      cmd(LoginAdminApi.call(params).then(onSubmitAdminResponse)),
    ]
  }
}

export function onSubmitResponse(response: LoginApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _LoginState(state, {
          loginResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    const { user, accessToken, refreshToken } = response.value

    AuthToken.set({
      role: "USER",
      userID: user.id,
      accessToken,
      refreshToken,
    })

    reconnectAuthenticated(String(accessToken.toJSON()))
    const nextState = _LoginState(initAuthUserState(user, state), {
      loginResponse: RD.success(response.value),
    })

    // Fire the goBack action as a command!
    // We use your 'perform' helper to trigger another Action from this one.
    const navigateCmd = cmd(perform(goBack()))

    return [nextState, navigateCmd]
  }
}

function onSubmitSellerResponse(response: LoginSellerApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _LoginState(state, {
          loginResponse: RD.failure(normalizeLoginError(response.error)),
        }),
        cmd(),
      ]
    }

    const { seller, accessToken, refreshToken } = response.value

    AuthToken.set({
      role: "SELLER",
      sellerID: seller.id,
      accessToken,
      refreshToken,
    })

    reconnectAuthenticated(String(accessToken.toJSON()))

    const nextState = _LoginState(initAuthSellerState(seller, state), {
      loginResponse: RD.notAsked(),
    })

    return [
      nextState,
      cmd(perform(navigateTo(toRoute("SellerDashboard", {})))),
    ]
  }
}

function onSubmitAdminResponse(response: LoginAdminApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _LoginState(state, {
          loginResponse: RD.failure(normalizeLoginError(response.error)),
        }),
        cmd(),
      ]
    }

    const { admin, accessToken, refreshToken } = response.value

    AuthToken.set({
      role: "ADMIN",
      adminID: admin.id,
      accessToken,
      refreshToken,
    })

    reconnectAuthenticated(String(accessToken.toJSON()))

    const nextState = _LoginState(initAuthAdminState(admin, state), {
      loginResponse: RD.notAsked(),
    })

    return [
      nextState,
      cmd(perform(navigateTo(toRoute("AdminDashboard", {})))),
    ]
  }
}

function normalizeLoginError(error: unknown): ApiError<LoginApi.ErrorCode> {
  switch (error) {
    case "USER_NOT_FOUND":
    case "SELLER_NOT_FOUND":
    case "ADMIN_NOT_FOUND":
      return "USER_NOT_FOUND"
    case "INVALID_PASSWORD":
      return "INVALID_PASSWORD"

    default:
      return "UNAUTHORISED"
  }
}
