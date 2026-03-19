import * as JD from "decoders"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import { ShopName, shopNameDecoder } from "./Seller/ShopName"
import { Description, descriptionDecoder } from "./Seller/ShopDescription"

export type SellerPublicProfile = {
  id: SellerID
  shopName: ShopName
  shopDescription: Description
}

export const sellerPublicProfileDecoder: JD.Decoder<SellerPublicProfile> =
  JD.object({
    id: sellerIDDecoder,
    shopName: shopNameDecoder,
    shopDescription: descriptionDecoder,
  })
