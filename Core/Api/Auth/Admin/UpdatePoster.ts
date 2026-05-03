import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { Poster, posterDecoder } from "../../../App/Poster"
import { PosterID, posterIDDecoder } from "../../../App/Poster/PosterID"
import { PosterName, posterNameDecoder } from "../../../App/Poster/PosterName"
import {
  PosterDescription,
  posterDescriptionDecoder,
} from "../../../App/Poster/PosterDescription"
import { ImageUrl, imageUrlDecoder } from "../../../App/Product/ProductImageUrl"
import { SDate, sdateStringDecoder } from "../../../Data/Time/SDate"

export type Contract = AuthApi<
  AuthAdmin,
  "PATCH",
  "/admin/poster/:id",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: PosterID
}

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

export type ErrorCode = "POSTER_NOT_FOUND" | "INVALID_DATE_RANGE"

export type Payload = {
  poster: Poster
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: posterIDDecoder,
})

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
  "POSTER_NOT_FOUND",
  "INVALID_DATE_RANGE",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  poster: posterDecoder,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/poster/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
