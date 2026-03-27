import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"
import { Poster, posterDecoder } from "../../../App/Poster"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/poster",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode
export type UrlParams = NoUrlParams

export type Payload = {
  posters: Poster[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  posters: JD.array(posterDecoder),
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/poster",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
