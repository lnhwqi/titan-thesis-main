import * as RD from "../../../Core/Data/RemoteData"
import { OrderPayment } from "../../../Core/App/OrderPayment"
import { OrderPaymentStatus } from "../../../Core/App/OrderPayment/OrderPaymentStatus"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as UserListApi from "../Api/Auth/User/OrderPayment/ListMine"
import * as UserConfirmDeliveryApi from "../Api/Auth/User/OrderPayment/ConfirmDelivery"
import * as SellerListApi from "../Api/Auth/Seller/OrderPayment/ListMine"
import * as SellerUpdateApi from "../Api/Auth/Seller/OrderPayment/UpdateTracking"

export type OrderPaymentState = {
  userOrders: OrderPayment[]
  sellerOrders: OrderPayment[]
  userOrdersResponse: RD.RemoteData<
    ApiError<UserListApi.ErrorCode>,
    UserListApi.Payload
  >
  sellerOrdersResponse: RD.RemoteData<
    ApiError<SellerListApi.ErrorCode>,
    SellerListApi.Payload
  >
  updateTrackingResponse: RD.RemoteData<
    ApiError<SellerUpdateApi.ErrorCode>,
    SellerUpdateApi.Payload
  >
  confirmDeliveryResponse: RD.RemoteData<
    ApiError<UserConfirmDeliveryApi.ErrorCode>,
    UserConfirmDeliveryApi.Payload
  >
  userOrdersPage: number
  userOrdersLimit: number
  userOrdersTotalCount: number
  statusDraftByOrderID: Record<string, OrderPaymentStatus>
  trackingDraftByOrderID: Record<string, string>
  flashMessage: string | null
}

export function initOrderPaymentState(): OrderPaymentState {
  return {
    userOrders: [],
    sellerOrders: [],
    userOrdersResponse: RD.notAsked(),
    sellerOrdersResponse: RD.notAsked(),
    updateTrackingResponse: RD.notAsked(),
    confirmDeliveryResponse: RD.notAsked(),
    userOrdersPage: 1,
    userOrdersLimit: 5,
    userOrdersTotalCount: 0,
    statusDraftByOrderID: {},
    trackingDraftByOrderID: {},
    flashMessage: null,
  }
}

export function _OrderPaymentState(
  state: State,
  orderPayment: Partial<OrderPaymentState>,
): State {
  return {
    ...state,
    orderPayment: { ...state.orderPayment, ...orderPayment },
  }
}
