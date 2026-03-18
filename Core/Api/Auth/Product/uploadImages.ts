import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { ImageUrl, imageUrlDecoder } from "../../../App/Product/ProductImageUrl"

export type { NoUrlParams }
export { noUrlParamsDecoder }

export type Contract = AuthApi<
  AuthSeller,
  "POST",
  "/seller/product/images",
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
  files: UploadImageFile[]
}

export type ErrorCode =
  | "NO_FILES"
  | "INVALID_FILE"
  | "TOO_MANY_FILES"
  | "UPLOAD_FAILED"

export type Payload = {
  urls: ImageUrl[]
}

export const uploadImageFileDecoder: JD.Decoder<UploadImageFile> = JD.object({
  name: JD.string,
  type: JD.string,
  dataUrl: JD.string,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  files: JD.array(uploadImageFileDecoder),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  urls: JD.array(imageUrlDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "NO_FILES",
  "INVALID_FILE",
  "TOO_MANY_FILES",
  "UPLOAD_FAILED",
])

export const contract: Contract = {
  method: "POST",
  route: "/seller/product/images",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
