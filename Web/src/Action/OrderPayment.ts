import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _OrderPaymentState } from "../State/OrderPayment"
import * as UserListApi from "../Api/Auth/User/OrderPayment/ListMine"
import * as SellerListApi from "../Api/Auth/Seller/OrderPayment/ListMine"
import * as SellerUpdateApi from "../Api/Auth/Seller/OrderPayment/UpdateTracking"
import { parseOrderPaymentID } from "../../../Core/App/OrderPayment/OrderPaymentID"
import { navigateTo, toRoute } from "../Route"
import { createOrderPaymentTrackingCode } from "../../../Core/App/OrderPayment/OrderPaymentTrackingCode"
import { OrderPaymentStatus } from "../../../Core/App/OrderPayment/OrderPaymentStatus"

export function onEnterUserOrdersRoute(): Action {
  return (state) => [
    _OrderPaymentState(state, {
      userOrdersResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(UserListApi.call().then(onUserListResponse)),
  ]
}

export function onEnterSellerOrdersRoute(): Action {
  return (state) => [
    _OrderPaymentState(state, {
      sellerOrdersResponse: RD.loading(),
      updateTrackingResponse: RD.notAsked(),
      flashMessage: null,
    }),
    cmd(SellerListApi.call().then(onSellerListResponse)),
  ]
}

export function clearFlashMessage(): Action {
  return (state) => [_OrderPaymentState(state, { flashMessage: null }), cmd()]
}

export function onChangeStatusDraft(
  orderID: string,
  status: OrderPaymentStatus,
): Action {
  return (state) => [
    _OrderPaymentState(state, {
      statusDraftByOrderID: {
        ...state.orderPayment.statusDraftByOrderID,
        [orderID]: status,
      },
    }),
    cmd(),
  ]
}

export function onChangeTrackingDraft(orderID: string, value: string): Action {
  return (state) => [
    _OrderPaymentState(state, {
      trackingDraftByOrderID: {
        ...state.orderPayment.trackingDraftByOrderID,
        [orderID]: value,
      },
    }),
    cmd(),
  ]
}

export function submitTrackingUpdate(orderID: string): Action {
  return (state) => {
    const status = state.orderPayment.statusDraftByOrderID[orderID] ?? "PACKED"
    const trackingDraft = (
      state.orderPayment.trackingDraftByOrderID[orderID] ?? ""
    ).trim()

    let parsedID
    try {
      parsedID = parseOrderPaymentID(orderID)
    } catch (_e) {
      return [
        _OrderPaymentState(state, { flashMessage: "Invalid order id." }),
        cmd(),
      ]
    }

    const trackingCode =
      trackingDraft === ""
        ? null
        : createOrderPaymentTrackingCode(trackingDraft)

    if (trackingDraft !== "" && trackingCode == null) {
      return [
        _OrderPaymentState(state, {
          flashMessage: "Invalid tracking code format.",
        }),
        cmd(),
      ]
    }

    const decodeUrl = SellerUpdateApi.urlParamsDecoder.decode({ id: parsedID })
    const decodeBody = SellerUpdateApi.bodyParamsDecoder.decode({
      status,
      trackingCode,
    })

    if (decodeUrl.ok === false || decodeBody.ok === false) {
      return [
        _OrderPaymentState(state, {
          flashMessage: "Invalid status or tracking code.",
        }),
        cmd(),
      ]
    }

    return [
      _OrderPaymentState(state, {
        updateTrackingResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        SellerUpdateApi.call(decodeUrl.value, decodeBody.value).then(
          onUpdateTrackingResponse,
        ),
      ),
    ]
  }
}

function onUserListResponse(response: UserListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _OrderPaymentState(state, {
          userOrdersResponse: RD.failure(response.error),
          flashMessage: UserListApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _OrderPaymentState(state, {
        userOrders: response.value.orders,
        userOrdersResponse: RD.success(response.value),
      }),
      cmd(),
    ]
  }
}

function onSellerListResponse(response: SellerListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _OrderPaymentState(state, {
          sellerOrdersResponse: RD.failure(response.error),
          flashMessage: SellerListApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const statusDraftByOrderID = { ...state.orderPayment.statusDraftByOrderID }
    const trackingDraftByOrderID = {
      ...state.orderPayment.trackingDraftByOrderID,
    }

    response.value.orders.forEach((order) => {
      const key = order.id.unwrap()
      statusDraftByOrderID[key] = order.status
      trackingDraftByOrderID[key] = order.trackingCode?.unwrap() ?? ""
    })

    return [
      _OrderPaymentState(state, {
        sellerOrders: response.value.orders,
        sellerOrdersResponse: RD.success(response.value),
        statusDraftByOrderID,
        trackingDraftByOrderID,
      }),
      cmd(),
    ]
  }
}

function onUpdateTrackingResponse(response: SellerUpdateApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _OrderPaymentState(state, {
          updateTrackingResponse: RD.failure(response.error),
          flashMessage: SellerUpdateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _OrderPaymentState(state, {
        updateTrackingResponse: RD.success(response.value),
        flashMessage: "Tracking status updated.",
      }),
      cmd(SellerListApi.call().then(onSellerListResponse)),
    ]
  }
}

export function goToSellerOrdersPage(): Action {
  return (state) => [
    state,
    cmd(perform(navigateTo(toRoute("SellerOrders", {})))),
  ]
}
