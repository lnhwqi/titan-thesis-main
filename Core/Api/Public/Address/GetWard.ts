import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"

export type Contract = Api<
  "GET",
  "/address/wards?district_id=:district_id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  district_id: string
}

export type Ward = {
  WardCode: string
  DistrictID: number
  WardName: string
}

export type ErrorCode = "GHN_ERROR"

export type Payload = Ward[]

export const wardDecoder: JD.Decoder<Ward> = JD.object({
  WardCode: JD.string,
  DistrictID: JD.number,
  WardName: JD.string,
})

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  district_id: JD.string,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.array(wardDecoder)

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf(["GHN_ERROR"])

export const contract: Contract = {
  method: "GET",
  route: "/address/wards?district_id=:district_id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
