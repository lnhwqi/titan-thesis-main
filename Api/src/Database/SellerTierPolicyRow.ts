import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"
import { Tax, createTax, taxDecoder } from "../../../Core/App/Seller/Tax"
import { Tier, tierDecoder } from "../../../Core/App/Seller/Tier"

const tableName = "seller_tier_policy"
const singletonID = "default"
const bronzeTier: Tier = tierDecoder.verify("bronze")
const silverTier: Tier = tierDecoder.verify("silver")
const goldTier: Tier = tierDecoder.verify("gold")

export type SellerTierPolicyRow = {
  id: string
  silverProfitThreshold: Nat
  goldProfitThreshold: Nat
  bronzeTax: Tax
  silverTax: Tax
  goldTax: Tax
  updatedAt: Timestamp
  createdAt: Timestamp
}

export const sellerTierPolicyRowDecoder: JD.Decoder<SellerTierPolicyRow> =
  JD.object({
    id: JD.string,
    silverProfitThreshold: natDecoder,
    goldProfitThreshold: natDecoder,
    bronzeTax: taxDecoder,
    silverTax: taxDecoder,
    goldTax: taxDecoder,
    updatedAt: timestampJSDateDecoder,
    createdAt: timestampJSDateDecoder,
  })

export type UpdateParams = {
  silverProfitThreshold: Nat
  goldProfitThreshold: Nat
  bronzeTax: Tax
  silverTax: Tax
  goldTax: Tax
}

const defaultPolicy: UpdateParams = {
  silverProfitThreshold: natDecoder.verify(1000),
  goldProfitThreshold: natDecoder.verify(5000),
  bronzeTax: taxDecoder.verify(10),
  silverTax: taxDecoder.verify(8),
  goldTax: taxDecoder.verify(5),
}

export async function getOrCreate(): Promise<SellerTierPolicyRow> {
  const existing = await db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", singletonID)
    .executeTakeFirst()

  if (existing != null) {
    return sellerTierPolicyRowDecoder.verify(existing)
  }

  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: singletonID,
      silverProfitThreshold: defaultPolicy.silverProfitThreshold.unwrap(),
      goldProfitThreshold: defaultPolicy.goldProfitThreshold.unwrap(),
      bronzeTax: defaultPolicy.bronzeTax.unwrap(),
      silverTax: defaultPolicy.silverTax.unwrap(),
      goldTax: defaultPolicy.goldTax.unwrap(),
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerTierPolicyRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.getOrCreate error ${e}`)
      throw e
    })
}

export async function update(
  params: UpdateParams,
): Promise<SellerTierPolicyRow> {
  const now = toDate(createNow())

  return db
    .updateTable(tableName)
    .set({
      silverProfitThreshold: params.silverProfitThreshold.unwrap(),
      goldProfitThreshold: params.goldProfitThreshold.unwrap(),
      bronzeTax: params.bronzeTax.unwrap(),
      silverTax: params.silverTax.unwrap(),
      goldTax: params.goldTax.unwrap(),
      updatedAt: now,
    })
    .where("id", "=", singletonID)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerTierPolicyRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.update error ${e}`)
      throw e
    })
}

export function tierAndTaxFromProfit(
  profit: { unwrap(): number },
  policy: Pick<
    SellerTierPolicyRow,
    | "silverProfitThreshold"
    | "goldProfitThreshold"
    | "bronzeTax"
    | "silverTax"
    | "goldTax"
  >,
): { tier: Tier; tax: Tax } {
  const normalizedGoldThreshold = Math.max(
    policy.goldProfitThreshold.unwrap(),
    policy.silverProfitThreshold.unwrap(),
  )

  if (profit.unwrap() >= normalizedGoldThreshold) {
    return {
      tier: goldTier,
      tax: policy.goldTax,
    }
  }

  if (profit.unwrap() >= policy.silverProfitThreshold.unwrap()) {
    return {
      tier: silverTier,
      tax: policy.silverTax,
    }
  }

  return {
    tier: bronzeTier,
    tax: policy.bronzeTax,
  }
}

export function normalizePolicyInput(params: UpdateParams): UpdateParams {
  const silverThreshold = params.silverProfitThreshold.unwrap()
  const goldThreshold = Math.max(
    params.goldProfitThreshold.unwrap(),
    silverThreshold,
  )

  return {
    silverProfitThreshold: params.silverProfitThreshold,
    goldProfitThreshold: natDecoder.verify(goldThreshold),
    bronzeTax: createTax(params.bronzeTax.unwrap()) || params.bronzeTax,
    silverTax: createTax(params.silverTax.unwrap()) || params.silverTax,
    goldTax: createTax(params.goldTax.unwrap()) || params.goldTax,
  }
}
