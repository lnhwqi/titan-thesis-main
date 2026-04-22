import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"
import { ProductRating, productRatingDecoder } from "../../../App/ProductRating"
import { ProductID, productIDDecoder } from "../../../App/Product/ProductID"

export type Contract = Api<
  "GET",
  "/products/:productID/ratings",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  productID: ProductID
}

export type ErrorCode = never

export type Payload = {
  ratings: ProductRating[]
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  productID: productIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  ratings: JD.array(productRatingDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.fail(
  "No error codes expected",
)

export const contract: Contract = {
  method: "GET",
  route: "/products/:productID/ratings",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
