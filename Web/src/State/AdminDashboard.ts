import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as ListPendingSellersApi from "../Api/Auth/Admin/ListPendingSellers"
import * as CreateCategoryApi from "../Api/Auth/Admin/CreateCategory"
import * as UpdateCategoryApi from "../Api/Auth/Admin/UpdateCategory"
import * as HomeAdminApi from "../Api/Auth/Admin/Home"
import * as AdminOrderPaymentListApi from "../Api/Auth/Admin/OrderPayment/List"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

export type AdminDashboardState = {
  pendingSellersResponse: RD.RemoteData<
    ApiError<ListPendingSellersApi.ErrorCode>,
    ListPendingSellersApi.Payload
  >
  adminHomeResponse: RD.RemoteData<
    ApiError<HomeAdminApi.ErrorCode>,
    HomeAdminApi.Payload
  >
  orderPaymentsResponse: RD.RemoteData<
    ApiError<AdminOrderPaymentListApi.ErrorCode>,
    AdminOrderPaymentListApi.Payload
  >
  approvingSellerIDs: string[]
  sendingVerifyEmailSellerIDs: string[]
  categoryRootName: string
  categoryChildParentID: CategoryID | null
  categoryChildParentName: string | null
  categoryChildName: string
  categoryEditID: CategoryID | null
  categoryEditName: string
  reportWindowHours: string
  deleteCategoryTarget: {
    id: CategoryID
    name: string
  } | null
  deletingCategoryIDs: string[]
  creatingCategoryResponse: RD.RemoteData<
    ApiError<CreateCategoryApi.ErrorCode>,
    CreateCategoryApi.Payload
  >
  updatingCategoryResponse: RD.RemoteData<
    ApiError<UpdateCategoryApi.ErrorCode>,
    UpdateCategoryApi.Payload
  >
  flashMessage: string | null
}

export function initAdminDashboardState(): AdminDashboardState {
  return {
    pendingSellersResponse: RD.notAsked(),
    adminHomeResponse: RD.notAsked(),
    orderPaymentsResponse: RD.notAsked(),
    approvingSellerIDs: [],
    sendingVerifyEmailSellerIDs: [],
    categoryRootName: "",
    categoryChildParentID: null,
    categoryChildParentName: null,
    categoryChildName: "",
    categoryEditID: null,
    categoryEditName: "",
    reportWindowHours: "72",
    deleteCategoryTarget: null,
    deletingCategoryIDs: [],
    creatingCategoryResponse: RD.notAsked(),
    updatingCategoryResponse: RD.notAsked(),
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
