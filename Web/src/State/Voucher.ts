import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as CreateVoucherApi from "../Api/Auth/Seller/Voucher/Create"
import * as ListVoucherApi from "../Api/Auth/Seller/Voucher/List"
import * as UpdateVoucherApi from "../Api/Auth/Seller/Voucher/Update"
import * as DeleteVoucherApi from "../Api/Auth/Seller/Voucher/Delete"
import { Voucher } from "../../../Core/App/Voucher"

export type VoucherState = {
  name: string
  code: string
  discount: string
  minOrderValue: string
  limit: string
  expiredDate: string
  vouchers: Voucher[]
  listResponse: RD.RemoteData<
    ApiError<ListVoucherApi.ErrorCode>,
    ListVoucherApi.Payload
  >
  editVoucherID: string | null
  editName: string
  editLimit: string
  editExpiredDate: string
  editActive: boolean
  updateResponse: RD.RemoteData<
    ApiError<UpdateVoucherApi.ErrorCode>,
    UpdateVoucherApi.Payload
  >
  pendingDeleteVoucherID: string | null
  deleteResponse: RD.RemoteData<
    ApiError<DeleteVoucherApi.ErrorCode>,
    DeleteVoucherApi.Payload
  >
  createResponse: RD.RemoteData<
    ApiError<CreateVoucherApi.ErrorCode>,
    CreateVoucherApi.Payload
  >
  flashMessage: string | null
}

export function initVoucherState(): VoucherState {
  return {
    name: "",
    code: "",
    discount: "",
    minOrderValue: "",
    limit: "",
    expiredDate: "",
    vouchers: [],
    listResponse: RD.notAsked(),
    editVoucherID: null,
    editName: "",
    editLimit: "",
    editExpiredDate: "",
    editActive: true,
    updateResponse: RD.notAsked(),
    pendingDeleteVoucherID: null,
    deleteResponse: RD.notAsked(),
    createResponse: RD.notAsked(),
    flashMessage: null,
  }
}

export function _VoucherState(
  state: State,
  voucher: Partial<VoucherState>,
): State {
  return {
    ...state,
    voucher: { ...state.voucher, ...voucher },
  }
}
