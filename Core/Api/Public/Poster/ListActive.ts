import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"
import { Poster, posterDecoder } from "../../../App/Poster"

export type Contract = Api<
  "GET",
  "/posters/active",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "NO_POSTERS_FOUND"

export type Payload = {
  posters: Poster[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  posters: JD.array(posterDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "NO_POSTERS_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/posters/active",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
