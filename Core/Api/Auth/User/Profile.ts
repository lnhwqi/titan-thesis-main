import * as JD from "decoders"
import { User, userDecoder } from "../../../App/User"
import { AuthApi, authResponseDecoder, AuthUser } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/profile",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>
export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  user: User
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  user: userDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/profile",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
