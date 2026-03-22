import * as RD from "../../../Core/Data/RemoteData"
import { Voucher } from "../../../Core/App/Voucher"
import { ApiError } from "../Api"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as ZaloPayCreateApi from "../Api/Auth/User/ZaloPay/Create"
import * as ZaloPayQueryApi from "../Api/Auth/User/ZaloPay/Query"
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
  zaloCheckout: ZaloPayCreateApi.Payload | null
  zaloStatusResponse: RD.RemoteData<
    ApiError<ZaloPayQueryApi.ErrorCode>,
    ZaloPayQueryApi.Payload
  >
  pendingFinalizeParams: OrderPaymentCreateApi.BodyParams | null
  pendingOrderPaymentIDs: string[]
  openedCheckoutAppTransID: string | null
  isFinalizing: boolean
  finalizedAppTransIDs: string[]
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
    zaloCheckout: null,
    zaloStatusResponse: RD.notAsked(),
    pendingFinalizeParams: null,
    pendingOrderPaymentIDs: [],
    openedCheckoutAppTransID: null,
    isFinalizing: false,
    finalizedAppTransIDs: [],
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
