import * as RD from "../../../Core/Data/RemoteData"
import { Voucher } from "../../../Core/App/Voucher"
import { ApiError } from "../Api"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as WalletDepositCreateApi from "../Api/Auth/User/Wallet/DepositCreate"
import * as WalletDepositQueryApi from "../Api/Auth/User/Wallet/DepositQuery"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import { Province } from "../../../Core/Api/Public/Address/GetProvince"
import { District } from "../../../Core/Api/Public/Address/GetDistrict"
import { Ward } from "../../../Core/Api/Public/Address/GetWard"
import type { State } from "../State"

export type PaymentState = {
  provinces: Province[]
  districts: District[]
  wards: Ward[]
  selectedProvinceID: number | null
  selectedDistrictID: number | null
  selectedWardCode: string | null
  addressDetail: string
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
  priceChangedVisible: boolean
  flashMessage: string | null
}

export function initPaymentState(): PaymentState {
  return {
    provinces: [],
    districts: [],
    wards: [],
    selectedProvinceID: null,
    selectedDistrictID: null,
    selectedWardCode: null,
    addressDetail: "",
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
    priceChangedVisible: false,
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
