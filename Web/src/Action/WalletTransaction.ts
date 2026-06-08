import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import { _WalletTransactionState } from "../State/WalletTransaction"
import * as WalletTransactionsApi from "../Api/Auth/User/WalletTransactions"

export function onEnterRoute(): Action {
  return (state) => {
    if (!("updateProfile" in state)) {
      return [state, cmd()]
    }

    return [
      _WalletTransactionState(state, { response: RD.loading() }),
      cmd(WalletTransactionsApi.call().then(onResponse)),
    ]
  }
}

function onResponse(response: WalletTransactionsApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _WalletTransactionState(state, { response: RD.failure(response.error) }),
        cmd(),
      ]
    }

    return [
      _WalletTransactionState(state, { response: RD.success(response.value) }),
      cmd(),
    ]
  }
}
