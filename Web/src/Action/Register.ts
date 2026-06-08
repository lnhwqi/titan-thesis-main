import { Action, cmd, perform } from "../Action"
import {
  _RegisterState,
  RegisterRole,
  initRegisterTouched,
} from "../State/Register"
import * as RegisterUserApi from "../Api/Public/RegisterUser"
import * as RegisterSellerApi from "../Api/Public/RegisterSeller"
import { navigateTo, toRoute } from "../Route"

const sellerPendingApprovalMessage =
  "Seller account created. Please wait for admin approval before using seller features. Please check your email for updates."

const registerSuccessLoginMessage =
  "Registration successful. You need to login first."

type OtpFlowErrorCode =
  | "OTP_REQUIRED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_SEND_FAILED"
  | "OTP_RATE_LIMITED"

export function onChangeRole(role: RegisterRole): Action {
  return (state) => [
    _RegisterState(state, {
      role,
      otpCode: "",
      otpModalOpen: false,
      otpModalMessage: null,
      status: { _t: "Idle" },
      touched:
        role === "SELLER"
          ? state.register.touched
          : { ...state.register.touched, shopName: false },
    }),
    cmd(),
  ]
}

export function onChangeName(name: string): Action {
  return (state) => [
    _RegisterState(state, {
      name,
      status: { _t: "Idle" },
      touched: { ...state.register.touched, name: true },
    }),
    cmd(),
  ]
}

export function onChangeEmail(email: string): Action {
  return (state) => [
    _RegisterState(state, {
      email,
      otpCode: "",
      otpModalOpen: false,
      otpModalMessage: null,
      status: { _t: "Idle" },
      touched: { ...state.register.touched, email: true },
    }),
    cmd(),
  ]
}

export function onChangePassword(password: string): Action {
  return (state) => [
    _RegisterState(state, {
      password,
      status: { _t: "Idle" },
      touched: { ...state.register.touched, password: true },
    }),
    cmd(),
  ]
}

export function onChangeOtpCode(otpCode: string): Action {
  const sanitizedOtpCode = otpCode.replace(/[^0-9]/g, "").slice(0, 6)

  return (state) => [
    _RegisterState(state, {
      otpCode: sanitizedOtpCode,
      status: { _t: "Idle" },
      otpModalMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeShopName(shopName: string): Action {
  return (state) => [
    _RegisterState(state, {
      shopName,
      status: { _t: "Idle" },
      touched: { ...state.register.touched, shopName: true },
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

export function requestOtp(): Action {
  return (state) => {
    const nextRegister = { ...state.register, otpCode: "" }

    return [
      _RegisterState(state, {
        otpCode: "",
        status: { _t: "Loading" },
        otpModalOpen: true,
        otpModalMessage: null,
      }),
      cmd(Promise.resolve().then(() => submit(nextRegister))),
    ]
  }
}

export function closeOtpModal(): Action {
  return (state) => [
    _RegisterState(state, {
      otpModalOpen: false,
      otpModalMessage: null,
    }),
    cmd(),
  ]
}

export function clearStatus(): Action {
  return (state) => [_RegisterState(state, { status: { _t: "Idle" } }), cmd()]
}

export function goToLoginAfterSuccess(): Action {
  return (state) => [
    _RegisterState(state, {
      status: { _t: "Idle" },
      otpModalOpen: false,
      otpModalMessage: null,
    }),
    cmd(perform(navigateTo(toRoute("Login", { redirect: null })))),
  ]
}

async function submit(register: {
  role: RegisterRole
  name: string
  email: string
  password: string
  otpCode: string
  shopName: string
}): Promise<Action> {
  if (register.role === "USER") {
    const trimmedOtpCode = register.otpCode.trim()

    const decoded = RegisterUserApi.paramsDecoder.decode({
      name: register.name,
      email: register.email,
      password: register.password,
      otpCode: trimmedOtpCode === "" ? undefined : trimmedOtpCode,
    })

    if (decoded.ok === false) {
      return submitInvalidInput()
    }

    const res = await RegisterUserApi.call(decoded.value)
    if (res._t === "Err") {
      return submitErrorWithOtpFlow(
        register.email,
        res.error,
        RegisterUserApi.errorString(res.error),
      )
    }

    return (_state) => [
      _RegisterState(_state, {
        name: "",
        email: "",
        password: "",
        otpCode: "",
        otpModalOpen: false,
        otpModalMessage: null,
        shopName: "",
        status: {
          _t: "Success",
          message: registerSuccessLoginMessage,
        },
        touched: initRegisterTouched(),
      }),
      cmd(),
    ]
  }

  const trimmedOtpCode = register.otpCode.trim()

  const decoded = RegisterSellerApi.paramsDecoder.decode({
    name: register.name,
    email: register.email,
    password: register.password,
    shopName: register.shopName,
    otpCode: trimmedOtpCode === "" ? undefined : trimmedOtpCode,
  })

  if (decoded.ok === false) {
    return submitInvalidInput()
  }

  const res = await RegisterSellerApi.call(decoded.value)
  if (res._t === "Err") {
    return submitErrorWithOtpFlow(
      register.email,
      res.error,
      RegisterSellerApi.errorString(res.error),
    )
  }

  return (_state) => [
    _RegisterState(_state, {
      name: "",
      email: "",
      password: "",
      otpCode: "",
      otpModalOpen: false,
      otpModalMessage: null,
      shopName: "",
      status: {
        _t: "Success",
        message: sellerPendingApprovalMessage,
      },
      touched: initRegisterTouched(),
    }),
    cmd(),
  ]
}

function submitInvalidInput(): Action {
  return submitError("Please check your input fields.")
}

function submitErrorWithOtpFlow(
  email: string,
  errorCode: string,
  fallbackMessage: string,
): Action {
  const otpFlowErrorCode = toOtpFlowErrorCode(errorCode)

  if (otpFlowErrorCode != null) {
    return (state) => [
      _RegisterState(state, {
        status: { _t: "Idle" },
        otpModalOpen: true,
        otpModalMessage: otpFlowMessage(
          otpFlowErrorCode,
          email,
          fallbackMessage,
        ),
      }),
      cmd(),
    ]
  }

  return submitError(fallbackMessage)
}

function toOtpFlowErrorCode(code: string): OtpFlowErrorCode | null {
  switch (code) {
    case "OTP_REQUIRED":
    case "OTP_INVALID":
    case "OTP_EXPIRED":
    case "OTP_SEND_FAILED":
    case "OTP_RATE_LIMITED":
      return code
    default:
      return null
  }
}

function otpFlowMessage(
  errorCode: OtpFlowErrorCode,
  email: string,
  fallbackMessage: string,
): string {
  const targetEmail = email.trim()

  switch (errorCode) {
    case "OTP_REQUIRED":
      return targetEmail === ""
        ? "A 6-digit OTP was sent. Enter it below to verify your email and complete registration."
        : `A 6-digit OTP was sent to ${targetEmail}. Enter it below to verify your email and complete registration.`
    case "OTP_INVALID":
      return "The OTP is invalid. Please enter the 6-digit code from your email."
    case "OTP_EXPIRED":
      return "Your OTP expired. Request a new code and try again."
    case "OTP_RATE_LIMITED":
      return "OTP was sent recently. Please wait a moment before requesting again."
    case "OTP_SEND_FAILED":
      return "We could not send OTP right now. Please try again shortly."
    default:
      return fallbackMessage
  }
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
