import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoPayload,
  noPayloadDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"

export { NoUrlParams, NoBodyParams }

export type Contract = AuthApi<
  AuthSeller,
  "POST",
  "/user/logout",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  NoPayload
>
export type Payload = NoPayload
export type ErrorCode = NoErrorCode
export const contract: Contract = {
  method: "POST",
  route: "/user/logout",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, noPayloadDecoder),
}
