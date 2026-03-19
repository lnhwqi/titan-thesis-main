import { SellerPublicProfile } from "../../../Core/App/SellerPublicProfile"
import { SellerRow } from "../Database/SellerRow"

export function toSellerPublicProfile(row: SellerRow): SellerPublicProfile {
  return {
    id: row.id,
    shopName: row.shopName,
    shopDescription: row.shopDescription,
  }
}
