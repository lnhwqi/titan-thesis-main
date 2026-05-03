import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { Poster, posterDecoder } from "../../../App/Poster"
import { PosterName, posterNameDecoder } from "../../../App/Poster/PosterName"
import {
  PosterDescription,
  posterDescriptionDecoder,
} from "../../../App/Poster/PosterDescription"
import { ImageUrl, imageUrlDecoder } from "../../../App/Product/ProductImageUrl"
import { SDate, sdateStringDecoder } from "../../../Data/Time/SDate"

export type { NoUrlParams }
export { noUrlParamsDecoder }

export type Contract = AuthApi<
  AuthAdmin,
  "POST",
  "/admin/poster",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  name: PosterName
  description: PosterDescription
  eventContent: string
  imageUrl: ImageUrl
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: SDate
  endDate: SDate | null
  isPermanent: boolean
}

export type ErrorCode = "INVALID_DATE_RANGE"

export type Payload = {
  poster: Poster
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: posterNameDecoder,
  description: posterDescriptionDecoder,
  eventContent: JD.string,
  imageUrl: imageUrlDecoder,
  imageScalePercent: JD.number,
  imageOffsetXPercent: JD.number,
  imageOffsetYPercent: JD.number,
  startDate: sdateStringDecoder,
  endDate: JD.nullable(sdateStringDecoder),
  isPermanent: JD.boolean,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_DATE_RANGE",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  poster: posterDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/admin/poster",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
