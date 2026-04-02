import * as JD from "decoders"
import { Nat, natDecoder } from "../../Data/Number/Nat"
import { Tax, taxDecoder } from "./Tax"

export type SellerTierPolicy = {
  silverProfitThreshold: Nat
  goldProfitThreshold: Nat
  bronzeTax: Tax
  silverTax: Tax
  goldTax: Tax
}

export const sellerTierPolicyDecoder: JD.Decoder<SellerTierPolicy> = JD.object({
  silverProfitThreshold: natDecoder,
  goldProfitThreshold: natDecoder,
  bronzeTax: taxDecoder,
  silverTax: taxDecoder,
  goldTax: taxDecoder,
})
