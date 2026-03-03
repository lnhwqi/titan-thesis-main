import { SellerRow } from "../Database/SellerRow"
import { Seller } from "../../../Core/App/Seller"

export function toSeller(row: SellerRow): Seller {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    wallet: row.wallet,
    active: row.active,
    shopName: row.shopName,
    verified: row.verified,
    vacationMode: row.vacationMode,
    revenue: row.revenue,
    withdrawn: row.withdrawn,
    profit: row.profit,
  }
}
