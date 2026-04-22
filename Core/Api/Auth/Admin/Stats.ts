import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"
import { Nat, natDecoder } from "../../../Data/Number/Nat"

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type DailyFinancialData = {
  date: string
  totalDeposited: Nat
  totalUsed: Nat
  remaining: Nat
}

export type Payload = {
  totalUsers: Nat
  newUsers: Nat
  totalSellers: Nat
  newSellers: Nat
  dailyFinancialData: DailyFinancialData[]
}

const dailyFinancialDataDecoder: JD.Decoder<DailyFinancialData> = JD.object({
  date: JD.string,
  totalDeposited: natDecoder,
  totalUsed: natDecoder,
  remaining: natDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  totalUsers: natDecoder,
  newUsers: natDecoder,
  totalSellers: natDecoder,
  newSellers: natDecoder,
  dailyFinancialData: JD.array(dailyFinancialDataDecoder),
})

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/stats",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export const contract: Contract = {
  method: "GET",
  route: "/admin/stats",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
