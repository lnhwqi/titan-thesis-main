import * as JD from "decoders"
import { Name, nameDecoder } from "./Admin/Name"
import { UserID, userIDDecoder } from "./Admin/AdminID"
import { Wallet, walletDecoder } from "./Admin/Wallet"
import { Active, activeDecoder } from "./Admin/Active"
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
