import * as JD from "decoders"
import { Seller, sellerDecoder } from "../../../App/Seller"
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
  "/admin/sellers/all",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode
export type UrlParams = NoUrlParams

export type Payload = {
  sellers: Seller[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  sellers: JD.array(sellerDecoder),
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/sellers/all",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
