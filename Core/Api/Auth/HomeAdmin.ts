import * as JD from "decoders"
import { Admin, adminDecoder } from "../../App/Admin"
import { AuthApi, authResponseDecoder } from "../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../Data/Api"

export type Contract = AuthApi<
  "GET",
  "/admin/dashboard",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  admin: Admin
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  admin: adminDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/dashboard",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
