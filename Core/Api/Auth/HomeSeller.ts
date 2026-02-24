import * as JD from "decoders"
import { Seller, sellerDecoder } from "../../App/Seller"
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
  "/seller/dashboard",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  seller: Seller
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/seller/dashboard",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
