import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { Admin, adminDecoder } from "../../../App/Admin"
import { Wallet, walletDecoder } from "../../../App/Admin/Wallet"
import { sellerDecoder } from "../../../App/Seller"

export type Contract = AuthApi<
  AuthSeller,
  "PATCH",
  "/admin/wallet",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  wallet: Wallet
}

export type ErrorCode = "WALLET_UPDATE_FAILED"
export type UrlParams = NoUrlParams
export type Payload = {
  admin: Admin
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  admin: adminDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "WALLET_UPDATE_FAILED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  wallet: walletDecoder,
})

export const urlParamsDecoder: JD.Decoder<NoUrlParams> = noUrlParamsDecoder

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/wallet",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
