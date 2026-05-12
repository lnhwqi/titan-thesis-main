import { Action, cmd, perform } from "../Action"
import { Wallet, createWalletE } from "../../../Core/App/User/Wallet"
import * as HomeUserApi from "../Api/Auth/User/Home"

/**
 * Directly set the global userBalance to a known Wallet value.
 */
export function setBalance(wallet: Wallet): Action {
  return (state) => [{ ...state, userBalance: wallet }, cmd()]
}

/**
 * Convert a raw number to Wallet and set it as the global balance.
 * No-ops if the number is invalid (negative / non-integer).
 */
export function setBalanceFromNumber(n: number): Action {
  return (state) => {
    const result = createWalletE(n)
    if (result._t === "Err") return [state, cmd()]
    return [{ ...state, userBalance: result.value }, cmd()]
  }
}

/**
 * Fetch the latest user profile from the server and refresh userBalance.
 * Also syncs state.profile.wallet when the state is authenticated.
 */
export function refreshBalance(): Action {
  return (state) => [state, cmd(HomeUserApi.call().then(onBalanceResponse))]
}

function onBalanceResponse(response: HomeUserApi.Response): Action {
  return (state) => {
    if (response._t === "Err") return [state, cmd()]
    const wallet = response.value.user.wallet
    const base = { ...state, userBalance: wallet }
    if ("updateProfile" in base) {
      return [{ ...base, profile: { ...base.profile, wallet } }, cmd()]
    }
    return [base, cmd()]
  }
}

export function _refreshBalance(): Promise<Action> {
  return Promise.resolve(refreshBalance())
}

// Convenience: use with cmd() when you need it as a Cmd entry
export function refreshBalanceCmd(): Promise<Action> {
  return perform(refreshBalance())
}
