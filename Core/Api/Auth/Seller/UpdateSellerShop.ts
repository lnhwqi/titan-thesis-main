import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { Seller, sellerDecoder } from "../../../App/Seller"
import { ShopName, shopNameDecoder } from "../../../App/Seller/ShopName"
import {
  Description,
  descriptionDecoder,
} from "../../../App/Seller/ShopDescription"

export type Contract = AuthApi<
  AuthSeller,
  "PUT",
  "/seller/shop-profile",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  shopName: ShopName
  shopDescription: Description
}

export type ErrorCode = "SHOP_NAME_ALREADY_EXISTS"

export type Payload = {
  seller: Seller
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SHOP_NAME_ALREADY_EXISTS",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  shopName: shopNameDecoder,
  shopDescription: descriptionDecoder,
})

export const urlParamsDecoder: JD.Decoder<NoUrlParams> = noUrlParamsDecoder

export const contract: Contract = {
  method: "PUT",
  route: "/seller/shop-profile",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
