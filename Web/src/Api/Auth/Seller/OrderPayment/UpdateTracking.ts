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
  UrlParams,
  BodyParams,
} from "../../../../../../Core/Api/Auth/Seller/OrderPayment/UpdateTracking"

export type { ErrorCode, Payload, UrlParams, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const urlParamsDecoder = contract.urlDecoder
export const bodyParamsDecoder = contract.bodyDecoder

export async function call(
  urlParams: UrlParams,
  bodyParams: BodyParams,
): Promise<Response> {
  return authApi(contract, urlParams, bodyParams)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "ORDER_PAYMENT_NOT_FOUND":
        return "Order not found."
    }
  })
}
