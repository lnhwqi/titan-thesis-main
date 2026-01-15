import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"

import { Category, categoryDecoder } from "../../../App/Category"

export type Contract = Api<
  "GET",
  "/categories/tree",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "CATEGORY_NOT_FOUND"

export type Payload = Category[]

export const payloadDecoder: JD.Decoder<Payload> = JD.array(categoryDecoder)

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "CATEGORY_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/categories/tree",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
