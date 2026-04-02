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
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"

export type Contract = AuthApi<
  AuthAdmin,
  "PATCH",
  "/admin/seller-tier-policy",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = SellerTierPolicy
export type ErrorCode = "INVALID_POLICY"

export type Payload = {
  sellerTierPolicy: SellerTierPolicy
}

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_POLICY",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  sellerTierPolicy: sellerTierPolicyDecoder,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/seller-tier-policy",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: sellerTierPolicyDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
