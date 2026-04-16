import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"

export type Contract = Api<
  "GET",
  "/address/districts?province_id=:province_id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  province_id: string
}

export type District = {
  DistrictID: number
  ProvinceID: number
  DistrictName: string
}

export type ErrorCode = "GHN_ERROR"

export type Payload = District[]

export const districtDecoder: JD.Decoder<District> = JD.object({
  DistrictID: JD.number,
  ProvinceID: JD.number,
  DistrictName: JD.string,
})

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  province_id: JD.string,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.array(districtDecoder)

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf(["GHN_ERROR"])

export const contract: Contract = {
  method: "GET",
  route: "/address/districts?province_id=:province_id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
