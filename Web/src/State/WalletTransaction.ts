import * as RD from "../../../Core/Data/RemoteData"
import type { WalletTransaction } from "../Api/Auth/User/WalletTransactions"
import type { ApiError } from "../Api"
import type { State } from "../State"

export type WalletTransactionState = {
  response: RD.RemoteData<
    ApiError<never>,
    { transactions: WalletTransaction[]; currentBalance: number }
  >
}

export function initWalletTransactionState(): WalletTransactionState {
  return {
    response: RD.notAsked(),
  }
}

export function _WalletTransactionState(
  state: State,
  patch: Partial<WalletTransactionState>,
): State {
  return { ...state, walletTransaction: { ...state.walletTransaction, ...patch } }
}
