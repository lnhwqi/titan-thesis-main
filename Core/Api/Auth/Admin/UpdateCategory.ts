import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { Category, categoryDecoder } from "../../../App/Category"
import { CategoryID, categoryIDDecoder } from "../../../App/Category/CategoryID"
import { Name, nameDecoder } from "../../../App/Category/Name"
import { Slug, slugDecoder } from "../../../App/Category/Slug"

export type Contract = AuthApi<
  AuthAdmin,
  "PATCH",
  "/admin/category/:id",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: CategoryID
}

export type BodyParams = {
  name: Name
  slug: Slug
}

export type ErrorCode = "CATEGORY_NOT_FOUND" | "SLUG_ALREADY_EXISTS"

export type Payload = {
  category: Category
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: categoryIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: nameDecoder,
  slug: slugDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "CATEGORY_NOT_FOUND",
  "SLUG_ALREADY_EXISTS",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  category: categoryDecoder,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/category/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
