import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"
import { Seller, sellerDecoder } from "../../../App/Seller"
import { UserID, userIDDecoder } from "../../../App/BaseProfile/UserID"

export { NoUrlParams, noUrlParamsDecoder }

export type Contract = Api<
  "POST",
  "/admin/approve-seller",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  sellerID: UserID
}

export type ErrorCode = "SELLER_NOT_FOUND" | "ALREADY_VERIFIED" | "UNAUTHORIZED"

export type Payload = {
  seller: Seller
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  sellerID: userIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SELLER_NOT_FOUND",
  "ALREADY_VERIFIED",
  "UNAUTHORIZED",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/admin/approve-seller",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
