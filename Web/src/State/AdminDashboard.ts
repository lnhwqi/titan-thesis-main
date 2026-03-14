import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as ListPendingSellersApi from "../Api/Auth/Admin/ListPendingSellers"

export type AdminDashboardState = {
  pendingSellersResponse: RD.RemoteData<
    ApiError<ListPendingSellersApi.ErrorCode>,
    ListPendingSellersApi.Payload
  >
  approvingSellerIDs: string[]
  flashMessage: string | null
}

export function initAdminDashboardState(): AdminDashboardState {
  return {
    pendingSellersResponse: RD.notAsked(),
    approvingSellerIDs: [],
    flashMessage: null,
  }
}

export function _AdminDashboardState(
  state: State,
  adminDashboard: Partial<AdminDashboardState>,
): State {
  return {
    ...state,
    adminDashboard: { ...state.adminDashboard, ...adminDashboard },
  }
}
