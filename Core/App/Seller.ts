import * as JD from "decoders"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import { Name, nameDecoder } from "./Seller/Name"
import { Wallet, walletDecoder } from "./Seller/Wallet"
import { Active, activeDecoder } from "./Seller/Active"
import { Email, emailDecoder } from "../Data/User/Email"
import { ShopName, shopNameDecoder } from "./Seller/ShopName"
import { Description, descriptionDecoder } from "./Seller/ShopDescription"
import { Verify, verifyDecoder } from "./Seller/Verify"
import { VacationMode, vacationModeDecoder } from "./Seller/VacationMode"
import { Revenue, revenueDecoder } from "./Seller/Revenue"
import { Withdrawn, withdrawnDecoder } from "./Seller/Withdrawn"
import { Profit, profitDecoder } from "./Seller/Profit"
import { Tier, tierDecoder } from "./Seller/Tier"
import { Tax, taxDecoder } from "./Seller/Tax"

export type Seller = {
  id: SellerID
  name: Name
  email: Email
  wallet: Wallet
  active: Active
  shopName: ShopName
  shopDescription: Description
  verified: Verify
  vacationMode: VacationMode
  revenue: Revenue
  withdrawn: Withdrawn
  profit: Profit
  tier: Tier
  tax: Tax
}

export const sellerDecoder: JD.Decoder<Seller> = JD.object({
  id: sellerIDDecoder,
  name: nameDecoder,
  email: emailDecoder,
  wallet: walletDecoder,
  active: activeDecoder,
  shopName: shopNameDecoder,
  shopDescription: descriptionDecoder,
  verified: verifyDecoder,
  vacationMode: vacationModeDecoder,
  revenue: revenueDecoder,
  withdrawn: withdrawnDecoder,
  profit: profitDecoder,
  tier: tierDecoder,
  tax: taxDecoder,
})
