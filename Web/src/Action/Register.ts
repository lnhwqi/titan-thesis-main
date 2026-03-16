import { Action, cmd, perform } from "../Action"
import { _RegisterState, RegisterRole } from "../State/Register"
import * as RegisterUserApi from "../Api/Public/RegisterUser"
import * as RegisterSellerApi from "../Api/Public/RegisterSeller"
import * as AuthToken from "../App/AuthToken"
import { navigateTo, toRoute } from "../Route"

const sellerPendingApprovalMessage =
  "Seller account created. Please wait for admin approval before using seller features. Please check your email for updates."

export function onChangeRole(role: RegisterRole): Action {
  return (state) => [
    _RegisterState(state, {
      role,
      status: { _t: "Idle" },
    }),
    cmd(),
  ]
}

export function onChangeName(name: string): Action {
  return (state) => [
    _RegisterState(state, {
      name,
      status: { _t: "Idle" },
    }),
    cmd(),
  ]
}

export function onChangeEmail(email: string): Action {
  return (state) => [
    _RegisterState(state, {
      email,
      status: { _t: "Idle" },
    }),
    cmd(),
  ]
}

export function onChangePassword(password: string): Action {
  return (state) => [
    _RegisterState(state, {
      password,
      status: { _t: "Idle" },
    }),
    cmd(),
  ]
}

export function onChangeShopName(shopName: string): Action {
  return (state) => [
    _RegisterState(state, {
      shopName,
      status: { _t: "Idle" },
    }),
    cmd(),
  ]
}

export function onSubmit(): Action {
  return (state) => {
    return [
      _RegisterState(state, { status: { _t: "Loading" } }),
      cmd(Promise.resolve().then(() => submit(state.register))),
    ]
  }
}

export function clearStatus(): Action {
  return (state) => [_RegisterState(state, { status: { _t: "Idle" } }), cmd()]
}

async function submit(register: {
  role: RegisterRole
  name: string
  email: string
  password: string
  shopName: string
}): Promise<Action> {
  if (register.role === "USER") {
    const decoded = RegisterUserApi.paramsDecoder.decode({
      name: register.name,
      email: register.email,
      password: register.password,
    })

    if (decoded.ok === false) {
      return submitInvalidInput()
    }

    const res = await RegisterUserApi.call(decoded.value)
    if (res._t === "Err") {
      return submitError(RegisterUserApi.errorString(res.error))
    }

    AuthToken.set({
      role: "USER",
      userID: res.value.user.id,
      accessToken: res.value.accessToken,
      refreshToken: res.value.refreshToken,
    })

    return (_state) => [
      _RegisterState(_state, { status: { _t: "Idle" } }),
      cmd(perform(navigateTo(toRoute("Home", {})))),
    ]
  }

  const decoded = RegisterSellerApi.paramsDecoder.decode({
    name: register.name,
    email: register.email,
    password: register.password,
    shopName: register.shopName,
  })

  if (decoded.ok === false) {
    return submitInvalidInput()
  }

  const res = await RegisterSellerApi.call(decoded.value)
  if (res._t === "Err") {
    return submitError(RegisterSellerApi.errorString(res.error))
  }

  return (_state) => [
    _RegisterState(_state, {
      name: "",
      email: "",
      password: "",
      shopName: "",
      status: {
        _t: "Success",
        message: sellerPendingApprovalMessage,
      },
    }),
    cmd(),
  ]
}

function submitInvalidInput(): Action {
  return submitError("Please check your input fields.")
}

function submitError(message: string): Action {
  return (state) => [
    _RegisterState(state, {
      status: {
        _t: "Error",
        message,
      },
    }),
    cmd(),
  ]
}
