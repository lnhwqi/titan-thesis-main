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

    const parsedTarget = parseSpamTarget(orderID, productID)
    if (parsedTarget == null) {
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
          orderID: parsedTarget.orderID,
          productID: parsedTarget.productID,
          reason: "SPAM",
          detail: null,
        }).then((response) => onReportSpamResponse(key, response)),
      ),
    ]
  }
}

function parseSpamTarget(
  orderID: string,
  productID: string,
): { orderID: OrderPaymentID; productID: ProductID } | null {
  try {
    return {
      orderID: orderPaymentIDDecoder.verify(orderID),
      productID: productIDDecoder.verify(productID),
    }
  } catch (_e) {
    return null
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
