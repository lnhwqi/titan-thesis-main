import * as RD from "../../../Core/Data/RemoteData"
import { Voucher } from "../../../Core/App/Voucher"
import { ApiError } from "../Api"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as WalletDepositCreateApi from "../Api/Auth/User/Wallet/DepositCreate"
import * as WalletDepositQueryApi from "../Api/Auth/User/Wallet/DepositQuery"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import type { State } from "../State"

export type PaymentState = {
  address: string
  depositAmount: string
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
  depositCreateResponse: RD.RemoteData<
    ApiError<WalletDepositCreateApi.ErrorCode>,
    WalletDepositCreateApi.Payload
  >
  depositStatusResponse: RD.RemoteData<
    ApiError<WalletDepositQueryApi.ErrorCode>,
    WalletDepositQueryApi.Payload
  >
  depositCheckout: WalletDepositCreateApi.Payload | null
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
    depositAmount: "",
    selectedVoucherBySellerID: {},
    sellerShopNameByID: {},
    mineVouchers: [],
    mineVouchersResponse: RD.notAsked(),
    submitResponse: RD.notAsked(),
    depositCreateResponse: RD.notAsked(),
    depositStatusResponse: RD.notAsked(),
    depositCheckout: null,
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
