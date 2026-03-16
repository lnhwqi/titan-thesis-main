import type { State } from "../State"

export type RegisterRole = "USER" | "SELLER"

export type RegisterStatus =
  | { _t: "Idle" }
  | { _t: "Loading" }
  | { _t: "Error"; message: string }
  | { _t: "Success"; message: string }

export type RegisterTouched = {
  name: boolean
  email: boolean
  password: boolean
  shopName: boolean
}

export type RegisterState = {
  role: RegisterRole
  name: string
  email: string
  password: string
  shopName: string
  status: RegisterStatus
  touched: RegisterTouched
}

export function initRegisterTouched(): RegisterTouched {
  return {
    name: false,
    email: false,
    password: false,
    shopName: false,
  }
}

export function initRegisterState(): RegisterState {
  return {
    role: "USER",
    name: "",
    email: "",
    password: "",
    shopName: "",
    status: { _t: "Idle" },
    touched: initRegisterTouched(),
  }
}

export function _RegisterState(
  state: State,
  register: Partial<RegisterState>,
): State {
  return { ...state, register: { ...state.register, ...register } }
}
