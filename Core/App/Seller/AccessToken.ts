import * as JD from "decoders"
import {
  JsonWebToken,
  jsonWebTokenDecoder,
} from "../../Data/Security/JsonWebToken"
import { SellerID, sellerIDDecoder } from "./SellerID"

export type JwtPayload = { sellerID: SellerID }

export type AccessToken = JsonWebToken<JwtPayload>

export const jwtPayloadDecoder: JD.Decoder<JwtPayload> = JD.object({
  sellerID: sellerIDDecoder,
})

export const accessTokenDecoder: JD.Decoder<AccessToken> =
  jsonWebTokenDecoder(jwtPayloadDecoder)
