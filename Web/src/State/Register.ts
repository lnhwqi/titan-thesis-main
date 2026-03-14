import type { State } from "../State"

export type RegisterRole = "USER" | "SELLER"

export type RegisterStatus =
  | { _t: "Idle" }
  | { _t: "Loading" }
  | { _t: "Error"; message: string }
  | { _t: "Success"; message: string }

export type RegisterState = {
  role: RegisterRole
  name: string
  email: string
  password: string
  shopName: string
  status: RegisterStatus
}

export function initRegisterState(): RegisterState {
  return {
    role: "USER",
    name: "",
    email: "",
    password: "",
    shopName: "",
    status: { _t: "Idle" },
  }
}

export function _RegisterState(
  state: State,
  register: Partial<RegisterState>,
): State {
  return { ...state, register: { ...state.register, ...register } }
}
