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
} from "../../../../../../Core/Api/Auth/User/Cart/Delete"

export type Response = ApiResponse<null, Payload>
export type { BodyParams, Payload }

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<null>): string {
  return apiErrorString(code, () => "Unable to remove cart item.")
}
