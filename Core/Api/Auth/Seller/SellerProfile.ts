import * as JD from "decoders"
import { Seller, sellerDecoder } from "../../../App/Seller"
import {
  SellerTierPolicy,
  sellerTierPolicyDecoder,
} from "../../../App/Seller/TierPolicy"
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
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"

export type Contract = AuthApi<
  AuthSeller,
  "GET",
  "/seller/profile",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode
export type Payload = {
  seller: Seller
  sellerTierPolicy: SellerTierPolicy
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerDecoder,
  sellerTierPolicy: sellerTierPolicyDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/seller/profile",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
