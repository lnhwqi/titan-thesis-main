import {
  authApi,
  apiErrorString,
  ApiError,
  ApiResponse,
} from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../../../Core/Api/Auth/User/ProductRating/Create"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "ORDER_PAYMENT_NOT_FOUND":
        return "Order not found."
      case "ORDER_NOT_OWNED_BY_USER":
        return "This order does not belong to you."
      case "PRODUCT_NOT_FOUND":
        return "Product not found."
      case "PRODUCT_NOT_IN_ORDER":
        return "This product was not part of the order."
      case "ORDER_PAYMENT_REPORTED":
        return "Cannot rate products on a reported order."
      case "RATING_WINDOW_NOT_OPEN":
        return "The rating window for this order has not opened yet or has closed."
      case "ALREADY_RATED_PRODUCT":
        return "You have already rated this product."
    }
  })
}
