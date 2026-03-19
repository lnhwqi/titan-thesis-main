import {
  authApi,
  ApiResponse,
  ApiError,
  apiErrorString,
} from "../../../AuthApi"
import {
  contract,
  BodyParams,
  Payload,
  ErrorCode,
} from "../../../../../../Core/Api/Auth/User/Cart/UpdateQuantity"

export type Response = ApiResponse<ErrorCode, Payload>
export type { BodyParams, Payload, ErrorCode }

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "PRODUCT_NOT_FOUND":
        return "Product not found."
      case "VARIANT_NOT_FOUND":
        return "Variant not found."
      case "VARIANT_NOT_IN_PRODUCT":
        return "Selected variant does not belong to this product."
      case "CART_ITEM_NOT_FOUND":
        return "Cart item not found."
      case "INVALID_QUANTITY":
        return "Invalid quantity."
      case "OUT_OF_STOCK":
        return "Not enough stock for this variant."
    }
  })
}
