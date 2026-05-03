import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"
import { Poster, posterDecoder } from "../../../App/Poster"
import { PosterID, posterIDDecoder } from "../../../App/Poster/PosterID"

export type Contract = Api<
  "GET",
  "/posters/:id",
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
  poster: Poster
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: posterIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  poster: posterDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "POSTER_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/posters/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
