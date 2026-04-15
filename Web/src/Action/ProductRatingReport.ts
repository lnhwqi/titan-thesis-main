import { Action, cmd } from "../Action"
import { _ProductRatingReportState } from "../State/ProductRatingReport"
import * as SellerReportSpamApi from "../Api/Auth/Seller/ProductRating/ReportSpam"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"

export function clearFlashMessage(): Action {
  return (state) => [
    _ProductRatingReportState(state, { flashMessage: null }),
    cmd(),
  ]
}

export function reportSpamRating(orderID: string, productID: string): Action {
  return (state) => {
    const key = `${orderID}:${productID}`

    let parsedOrderID: OrderPaymentID
    let parsedProductID: ProductID
    try {
      parsedOrderID = orderPaymentIDDecoder.verify(orderID)
      parsedProductID = productIDDecoder.verify(productID)
    } catch (_e) {
      return [
        _ProductRatingReportState(state, {
          flashMessage: "Invalid order or product ID.",
        }),
        cmd(),
      ]
    }

    return [
      _ProductRatingReportState(state, {
        reportingKey: key,
        flashMessage: null,
      }),
      cmd(
        SellerReportSpamApi.call({
          orderID: parsedOrderID,
          productID: parsedProductID,
          reason: "SPAM",
          detail: null,
        }).then((response) => onReportSpamResponse(key, response)),
      ),
    ]
  }
}

function onReportSpamResponse(
  key: string,
  response: SellerReportSpamApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductRatingReportState(state, {
          reportingKey: null,
          flashMessage: SellerReportSpamApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ProductRatingReportState(state, {
        reportingKey: null,
        flashMessage: "Spam rating reported successfully.",
      }),
      cmd(),
    ]
  }
}
