import * as JD from "decoders"
import { UserID, userIDDecoder } from "./User/UserID"
import { Name, nameDecoder } from "./User/Name"
import { Wallet, walletDecoder } from "./User/Wallet"
import { Active, activeDecoder } from "./User/Active"
import { Email, emailDecoder } from "../Data/User/Email"
import { Points, pointsDecoder } from "./User/Points"
import { Tier, tierDecoder } from "./User/Tier"

export type User = {
  id: UserID
  name: Name
  email: Email
  wallet: Wallet
  active: Active
  points: Points
  tier: Tier
}

export const userDecoder: JD.Decoder<User> = JD.object({
  id: userIDDecoder,
  name: nameDecoder,
  email: emailDecoder,
  wallet: walletDecoder,
  active: activeDecoder,
  points: pointsDecoder,
  tier: tierDecoder,
})
