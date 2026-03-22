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
} from "../../../../../../Core/Api/Auth/User/OrderPayment/Create"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "SELLER_NOT_FOUND":
        return "Seller not found."
      case "VARIANT_NOT_FOUND":
        return "A selected product variant was not found."
      case "INSUFFICIENT_STOCK":
        return "Some products are out of stock or have insufficient stock."
      case "INSUFFICIENT_WALLET":
        return "Insufficient wallet balance. Please deposit first."
      case "VOUCHER_NOT_FOUND":
        return "Voucher not found."
      case "VOUCHER_NOT_FOR_SELLER":
        return "Selected voucher does not belong to this shop."
      case "VOUCHER_EXPIRED":
        return "Voucher is expired."
      case "VOUCHER_MIN_VALUE_NOT_MET":
        return "Voucher minimum value is not met."
      case "VOUCHER_ALREADY_USED":
        return "Voucher was already used."
    }
  })
}
