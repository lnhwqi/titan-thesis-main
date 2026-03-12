import * as JD from "decoders"
import { AdminID, adminIDDecoder } from "./Admin/AdminID"
import { Name, nameDecoder } from "./Admin/Name"
import { Wallet, walletDecoder } from "./Admin/Wallet"
import { Active, activeDecoder } from "./Admin/Active"
import { Email, emailDecoder } from "../Data/User/Email"

export type Admin = {
  id: AdminID
  name: Name
  email: Email
  wallet: Wallet
  active: Active
}

export const adminDecoder: JD.Decoder<Admin> = JD.object({
  id: adminIDDecoder,
  name: nameDecoder,
  email: emailDecoder,
  wallet: walletDecoder,
  active: activeDecoder,
})
