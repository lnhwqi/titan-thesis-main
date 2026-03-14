import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { Seller, sellerDecoder } from "../../../App/Seller"
import { SellerID, sellerIDDecoder } from "../../../App/Seller/SellerID"

export type { NoUrlParams }
export { noUrlParamsDecoder }

export type Contract = AuthApi<
  AuthAdmin,
  "POST",
  "/admin/approve-seller",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  sellerID: SellerID
}

export type ErrorCode = "SELLER_NOT_FOUND" | "ALREADY_VERIFIED"

export type Payload = {
  seller: Seller
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  sellerID: sellerIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SELLER_NOT_FOUND",
  "ALREADY_VERIFIED",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/admin/approve-seller",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
