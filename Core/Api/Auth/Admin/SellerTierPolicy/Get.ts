import * as JD from "decoders"
import {
  SellerTierPolicy,
  sellerTierPolicyDecoder,
} from "../../../../App/Seller/TierPolicy"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../Data/Api"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/seller-tier-policy",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  sellerTierPolicy: SellerTierPolicy
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  sellerTierPolicy: sellerTierPolicyDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/seller-tier-policy",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
