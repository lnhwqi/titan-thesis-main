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
  "/products",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>
export type UrlParams = {
  name?: string
  page?: number
  limit?: number
}
export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  name: JD.optional(JD.string),
  page: JD.optional(JD.number),
  limit: JD.optional(JD.number),
})
export type ErrorCode = "NO_PRODUCTS_FOUND"

export type Payload = {
  items: BasicProduct[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  items: JD.array(basicProductDecoder),
})
export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "NO_PRODUCTS_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/products",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
