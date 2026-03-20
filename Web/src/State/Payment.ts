import * as RD from "../../../Core/Data/RemoteData"
import { Voucher } from "../../../Core/App/Voucher"
import { ApiError } from "../Api"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import type { State } from "../State"

export type PaymentState = {
  address: string
  selectedVoucherBySellerID: Record<string, string | null>
  sellerShopNameByID: Record<string, string>
  mineVouchers: Voucher[]
  mineVouchersResponse: RD.RemoteData<
    ApiError<VoucherListMineApi.ErrorCode>,
    VoucherListMineApi.Payload
  >
  submitResponse: RD.RemoteData<
    ApiError<OrderPaymentCreateApi.ErrorCode>,
    OrderPaymentCreateApi.Payload
  >
  flashMessage: string | null
}

export function initPaymentState(): PaymentState {
  return {
    address: "",
    selectedVoucherBySellerID: {},
    sellerShopNameByID: {},
    mineVouchers: [],
    mineVouchersResponse: RD.notAsked(),
    submitResponse: RD.notAsked(),
    flashMessage: null,
  }
}

export function _PaymentState(
  state: State,
  payment: Partial<PaymentState>,
): State {
  return {
    ...state,
    payment: { ...state.payment, ...payment },
  }
}
