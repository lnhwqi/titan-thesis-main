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
} from "../../../../../../Core/Api/Auth/Seller/ProductRating/ReportSpam"

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
      case "ORDER_NOT_FOR_SELLER":
        return "This order does not belong to your shop."
      case "PRODUCT_NOT_FOUND":
        return "Product not found."
      case "PRODUCT_NOT_FOR_SELLER":
        return "This product does not belong to your shop."
      case "PRODUCT_NOT_IN_ORDER":
        return "This product was not part of the order."
      case "RATING_NOT_FOUND":
        return "No rating found for this product in the order."
      case "RATING_REPORT_ALREADY_EXISTS":
        return "You have already reported this rating."
      case "DAILY_REPORT_LIMIT_REACHED":
        return "You have reached the daily report limit. Please try again tomorrow."
    }
  })
}
