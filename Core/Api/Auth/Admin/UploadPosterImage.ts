import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { ImageUrl, imageUrlDecoder } from "../../../App/Product/ProductImageUrl"

export type { NoUrlParams }
export { noUrlParamsDecoder }

export type Contract = AuthApi<
  AuthAdmin,
  "POST",
  "/admin/poster/image",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UploadImageFile = {
  name: string
  type: string
  dataUrl: string
}

export type BodyParams = {
  file: UploadImageFile
}

export type ErrorCode = "NO_FILE" | "INVALID_FILE" | "UPLOAD_FAILED"

export type Payload = {
  url: ImageUrl
}

export const uploadImageFileDecoder: JD.Decoder<UploadImageFile> = JD.object({
  name: JD.string,
  type: JD.string,
  dataUrl: JD.string,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  file: uploadImageFileDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  url: imageUrlDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "NO_FILE",
  "INVALID_FILE",
  "UPLOAD_FAILED",
])

export const contract: Contract = {
  method: "POST",
  route: "/admin/poster/image",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
