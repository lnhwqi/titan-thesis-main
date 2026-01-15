import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"

import { Category, categoryDecoder } from "../../../App/Category"
import { CategoryID, categoryIDDecoder } from "../../../App/Category/CategoryID"

export type Contract = Api<
  "GET",
  "/categories/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>
export type UrlParams = {
  id: CategoryID
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: categoryIDDecoder,
})

export type ErrorCode = "CATEGORY_NOT_FOUND"

export type Payload = Category

export const payloadDecoder: JD.Decoder<Payload> = categoryDecoder

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "CATEGORY_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/categories/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
