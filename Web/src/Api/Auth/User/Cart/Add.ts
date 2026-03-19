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
} from "../../../../../../Core/Api/Auth/User/Cart/Add"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

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
      case "OUT_OF_STOCK":
        return "Not enough stock for this variant."
    }
  })
}
