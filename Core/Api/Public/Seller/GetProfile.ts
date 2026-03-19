import * as JD from "decoders"
import {
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
  responseDecoder,
} from "../../../Data/Api"
import { SellerID, sellerIDDecoder } from "../../../App/Seller/SellerID"
import {
  SellerPublicProfile,
  sellerPublicProfileDecoder,
} from "../../../App/SellerPublicProfile"

export type Contract = Api<
  "GET",
  "/sellers/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: SellerID
}

export type ErrorCode = "SELLER_NOT_FOUND"

export type Payload = {
  seller: SellerPublicProfile
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: sellerIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerPublicProfileDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SELLER_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/sellers/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
