import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"
import { BasicProduct, basicProductDecoder } from "../../../App/ProductBasic"
export type Contract = Api<
  "GET",
  "/products/search",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>
export type UrlParams = {
  name?: string
}
export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  name: JD.optional(JD.string),
})

export type ErrorCode = "PRODUCT_NOT_FOUND"

export type Payload = BasicProduct[]

export const payloadDecoder: JD.Decoder<Payload> = JD.array(basicProductDecoder)

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/products/search",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
