import * as JD from "decoders"
import { Name, nameDecoder } from "./BaseProfile/Name"
import { UserID, userIDDecoder } from "./BaseProfile/UserID"
import { Wallet, walletDecoder } from "./BaseProfile/Wallet"
import { Active, activeDecoder } from "./BaseProfile/Active"
import { Email, emailDecoder } from "../Data/User/Email"

/** Provided as an example for App-level Type 1
 * User type differs from app to app
 * so it cannot belong to Data context-folder
 */
export type BaseProfile = {
  id: UserID
  name: Name
  email: Email
  wallet: Wallet
  active: Active
}

export const BaseProfileDecoder: JD.Decoder<BaseProfile> = JD.object({
  id: userIDDecoder,
  name: nameDecoder,
  email: emailDecoder,
  wallet: walletDecoder,
  active: activeDecoder,
})
