import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { Category, categoryDecoder } from "../../../App/Category"
import { CategoryID, categoryIDDecoder } from "../../../App/Category/CategoryID"
import { Name, nameDecoder } from "../../../App/Category/Name"
import { Slug, slugDecoder } from "../../../App/Category/Slug"

export type { NoUrlParams }
export { noUrlParamsDecoder }

export type Contract = AuthApi<
  AuthAdmin,
  "POST",
  "/admin/category",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  name: Name
  slug: Slug
  parentID: CategoryID | null
}

export type ErrorCode = "PARENT_CATEGORY_NOT_FOUND" | "SLUG_ALREADY_EXISTS"

export type Payload = {
  category: Category
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: nameDecoder,
  slug: slugDecoder,
  parentID: JD.nullable(categoryIDDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PARENT_CATEGORY_NOT_FOUND",
  "SLUG_ALREADY_EXISTS",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  category: categoryDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/admin/category",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
