import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"

export type Contract = Api<
  "GET",
  "/address/provinces",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type Province = {
  ProvinceID: number
  ProvinceName: string
}

export type ErrorCode = "GHN_ERROR"

export type Payload = Province[]

export const provinceDecoder: JD.Decoder<Province> = JD.object({
  ProvinceID: JD.number,
  ProvinceName: JD.string,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.array(provinceDecoder)

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf(["GHN_ERROR"])

export const contract: Contract = {
  method: "GET",
  route: "/address/provinces",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
