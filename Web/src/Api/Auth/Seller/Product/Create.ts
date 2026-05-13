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
} from "../../../../../../Core/Api/Auth/Product/create"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "SELLER_NOT_APPROVED":
        return "Your seller account is not approved by admin yet."
      case "CATEGORY_NOT_FOUND":
        return "Category not found."
      case "SKU_ALREADY_EXISTS":
        return "SKU already exists."
      case "INVALID_PRODUCT_INPUT":
        return "Product input is invalid. Check price and stock ranges, then try again."
    }
  })
}
