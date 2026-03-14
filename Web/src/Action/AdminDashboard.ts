import { SellerID } from "../../../Core/App/Seller/SellerID"
import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, Cmd } from "../Action"
import * as ListPendingSellersApi from "../Api/Auth/Admin/ListPendingSellers"
import * as ApproveSellerApi from "../Api/Auth/Admin/ApproveSeller"
import { _AdminDashboardState } from "../State/AdminDashboard"
import { State } from "../State"

export function onEnterRoute(state: State): [State, Cmd] {
  return loadPendingSellers()(state)
}

export function loadPendingSellers(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      pendingSellersResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(ListPendingSellersApi.call().then(onLoadPendingResponse)),
  ]
}

function onLoadPendingResponse(response: ListPendingSellersApi.Response): Action {
  return (state) => [
    _AdminDashboardState(state, {
      pendingSellersResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

export function approveSeller(sellerID: SellerID): Action {
  return (state) => {
    const id = sellerID.unwrap()
    const next = state.adminDashboard.approvingSellerIDs.includes(id)
      ? state.adminDashboard.approvingSellerIDs
      : [...state.adminDashboard.approvingSellerIDs, id]

    return [
      _AdminDashboardState(state, { approvingSellerIDs: next, flashMessage: null }),
      cmd(ApproveSellerApi.call({ sellerID }).then((res) => onApproveResponse(id, res))),
    ]
  }
}

function onApproveResponse(
  sellerID: string,
  response: ApproveSellerApi.Response,
): Action {
  return (state) => {
    const approvingSellerIDs = state.adminDashboard.approvingSellerIDs.filter(
      (x) => x !== sellerID,
    )

    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          approvingSellerIDs,
          flashMessage: ApproveSellerApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const current = state.adminDashboard.pendingSellersResponse

    if (current._t !== "Success") {
      return [
        _AdminDashboardState(state, {
          approvingSellerIDs,
          flashMessage:
            "Seller approved. You can now send verification email via your mail service.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        approvingSellerIDs,
        pendingSellersResponse: RD.success({
          sellers: current.data.sellers.filter(
            (seller) => seller.id.unwrap() !== sellerID,
          ),
        }),
        flashMessage:
          "Seller approved. You can now send verification email via your mail service.",
      }),
      cmd(),
    ]
  }
}

export function clearFlashMessage(): Action {
  return (state) => [_AdminDashboardState(state, { flashMessage: null }), cmd()]
}
