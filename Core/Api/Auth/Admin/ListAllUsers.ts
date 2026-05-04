import * as JD from "decoders"
import { User, userDecoder } from "../../../App/User"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/users/all",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode
export type UrlParams = NoUrlParams

export type Payload = {
  users: User[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  users: JD.array(userDecoder),
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/users/all",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
