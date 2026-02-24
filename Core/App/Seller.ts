import * as JD from "decoders"
import { BaseProfile } from "./BaseProfile"
import { userIDDecoder } from "./BaseProfile/UserID"
import { nameDecoder } from "./BaseProfile/Name"
import { walletDecoder } from "./BaseProfile/Wallet"
import { activeDecoder } from "./BaseProfile/Active"
import { emailDecoder } from "../Data/User/Email"
import { ShopName, shopNameDecoder } from "./Seller/ShopName"
import { Verify, verifyDecoder } from "./Seller/Verify"
import { VacationMode, vacationModeDecoder } from "./Seller/VacationMode"
import { Revenue, revenueDecoder } from "./Seller/Revenue"
import { Withdrawn, withdrawnDecoder } from "./Seller/Withdrawn"
import { Profit, profitDecoder } from "./Seller/Profit"

export type Seller = BaseProfile & {
  shopName: ShopName
  verified: Verify
  vacationMode: VacationMode
  revenue: Revenue
  withdrawn: Withdrawn
  profit: Profit
}

export const sellerDecoder: JD.Decoder<Seller> = JD.object({
  id: userIDDecoder,
  name: nameDecoder,
  email: emailDecoder,
  wallet: walletDecoder,
  active: activeDecoder,
  shopName: shopNameDecoder,
  verified: verifyDecoder,
  vacationMode: vacationModeDecoder,
  revenue: revenueDecoder,
  withdrawn: withdrawnDecoder,
  profit: profitDecoder,
})
