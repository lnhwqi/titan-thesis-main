import * as JD from "decoders"
import {
  JsonWebToken,
  jsonWebTokenDecoder,
} from "../../Data/Security/JsonWebToken"
import { AdminID, adminIDDecoder } from "./AdminID"

export type JwtPayload = { adminID: AdminID }

export type AccessToken = JsonWebToken<JwtPayload>

export const jwtPayloadDecoder: JD.Decoder<JwtPayload> = JD.object({
  adminID: adminIDDecoder,
})

export const accessTokenDecoder: JD.Decoder<AccessToken> =
  jsonWebTokenDecoder(jwtPayloadDecoder)
