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
  "/products/search?name=:name&page=:page&limit=:limit&sortBy=:sortBy",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>
export type SortByOption = "price-low" | "price-high" | "newest" | "oldest"

export type UrlParams = {
  name: string
  page: number
  limit: number
  sortBy: SortByOption
}
export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  name: JD.string,
  page: JD.optional(JD.either(JD.string, JD.number)),
  limit: JD.optional(JD.either(JD.string, JD.number)),
  sortBy: JD.optional(JD.string),
}).transform((obj) => {
  const pageParsed = obj.page ? Number(obj.page) : 1
  const limitParsed = obj.limit ? Number(obj.limit) : 12
  const sortByValue = obj.sortBy ?? "newest"

  const sortByResult = ((sortByValue): SortByOption => {
    switch (sortByValue) {
      case "price-low":
      case "price-high":
      case "newest":
      case "oldest":
        return sortByValue
      default:
        return "newest"
    }
  })(sortByValue)

  return {
    name: obj.name,
    page: Number.isNaN(pageParsed) ? 1 : pageParsed,
    limit: Number.isNaN(limitParsed) ? 12 : limitParsed,
    sortBy: sortByResult,
  }
})

export type ErrorCode = "PRODUCT_NOT_FOUND"

export type Payload = {
  items: BasicProduct[]
  page: number
  limit: number
  totalCount: number
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  items: JD.array(basicProductDecoder),
  page: JD.number,
  limit: JD.number,
  totalCount: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/products/search?name=:name&page=:page&limit=:limit&sortBy=:sortBy",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
