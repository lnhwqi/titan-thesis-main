import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../Data/Api"
import { CategoryID, categoryIDDecoder } from "../../../App/Category/CategoryID"

export type { NoBodyParams }
export { noBodyParamsDecoder }

export type Contract = AuthApi<
  AuthAdmin,
  "DELETE",
  "/admin/category/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: CategoryID
}

export type ErrorCode = "CATEGORY_NOT_FOUND"

export type Payload = {
  id: CategoryID
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: categoryIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  id: categoryIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "CATEGORY_NOT_FOUND",
])

export const contract: Contract = {
  method: "DELETE",
  route: "/admin/category/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
