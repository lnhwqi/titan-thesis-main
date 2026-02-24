import * as JD from "decoders"
import { BaseProfile } from "./BaseProfile"
import { userIDDecoder } from "./BaseProfile/UserID"
import { nameDecoder } from "./BaseProfile/Name"
import { walletDecoder } from "./BaseProfile/Wallet"
import { activeDecoder } from "./BaseProfile/Active"
import { emailDecoder } from "../Data/User/Email"

export type Admin = BaseProfile & {}

export const adminDecoder: JD.Decoder<Admin> = JD.object({
  id: userIDDecoder,
  name: nameDecoder,
  email: emailDecoder,
  wallet: walletDecoder,
  active: activeDecoder,
})
