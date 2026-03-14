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
} from "../../../../../../Core/Api/Auth/Product/update"

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
      case "PRODUCT_NOT_FOUND":
        return "Product not found."
      case "CATEGORY_NOT_FOUND":
        return "Category not found."
      case "SKU_ALREADY_EXISTS":
        return "SKU already exists."
      case "FORBIDDEN_ACTION":
        return "You do not have permission to modify this product."
    }
  })
}
