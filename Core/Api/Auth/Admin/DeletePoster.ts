import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../Data/Api"
import { PosterID, posterIDDecoder } from "../../../App/Poster/PosterID"

export type { NoBodyParams }
export { noBodyParamsDecoder }

export type Contract = AuthApi<
  AuthAdmin,
  "DELETE",
  "/admin/poster/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: PosterID
}

export type ErrorCode = "POSTER_NOT_FOUND"

export type Payload = {
  id: PosterID
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: posterIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  id: posterIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "POSTER_NOT_FOUND",
])

export const contract: Contract = {
  method: "DELETE",
  route: "/admin/poster/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
