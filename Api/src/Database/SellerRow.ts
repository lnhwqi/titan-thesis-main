import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { Maybe } from "../../../Core/Data/Maybe"
import { Hash } from "../Data/Hash"
import { Email, emailDecoder } from "../../../Core/Data/User/Email"
import { Name, nameDecoder } from "../../../Core/App/Seller/Name"
import {
  createSellerID,
  SellerID,
  sellerIDDecoder,
} from "../../../Core/App/Seller/SellerID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { Wallet, walletDecoder } from "../../../Core/App/Seller/Wallet"
import { Active, activeDecoder } from "../../../Core/App/Seller/Active"
import { ShopName, shopNameDecoder } from "../../../Core/App/Seller/ShopName"
import { Verify, verifyDecoder } from "../../../Core/App/Seller/Verify"
import {
  VacationMode,
  vacationModeDecoder,
} from "../../../Core/App/Seller/VacationMode"
import { Revenue, revenueDecoder } from "../../../Core/App/Seller/Revenue"
import { Withdrawn, withdrawnDecoder } from "../../../Core/App/Seller/Withdrawn"
import { Profit, profitDecoder } from "../../../Core/App/Seller/Profit"
import { Tier, tierDecoder } from "../../../Core/App/Seller/Tier"
import { Tax, taxDecoder } from "../../../Core/App/Seller/Tax"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"
import {
  createDescription,
  Description,
} from "../../../Core/App/Seller/ShopDescription"
import * as SellerTierPolicyRow from "./SellerTierPolicyRow"

const tableName = "seller"
const defaultShopDescription = "No shop description yet"

export type SellerRow = {
  id: SellerID
  email: Email
  name: Name
  password: string
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
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  email: Email
  name: Name
  hashedPassword: Hash
  shopName: ShopName
}

export const sellerRowDecoder: JD.Decoder<SellerRow> = JD.object({
  id: sellerIDDecoder,
  email: emailDecoder,
  name: nameDecoder,
  password: JD.string,
  wallet: walletDecoder,
  active: activeDecoder,
  shopName: shopNameDecoder,
  shopDescription: JD.string.transform((s) => {
    const normalized = s.trim() === "" ? defaultShopDescription : s
    const description = createDescription(normalized)
    if (description == null) {
      throw new Error("INVALID_SHOP_DESCRIPTION")
    }
    return description
  }),
  verified: verifyDecoder,
  vacationMode: vacationModeDecoder,
  revenue: revenueDecoder,
  withdrawn: withdrawnDecoder,
  profit: profitDecoder,
  tier: tierDecoder,
  tax: taxDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})

export async function create(params: CreateParams): Promise<SellerRow> {
  const { email, name, hashedPassword, shopName } = params
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: createSellerID().unwrap(),
      email: email.unwrap(),
      name: name.unwrap(),
      password: hashedPassword.unwrap(),
      wallet: 0,
      active: false,
      shopName: shopName.unwrap(),
      shopDescription: defaultShopDescription,
      verified: false,
      vacationMode: false,
      revenue: 0,
      withdrawn: 0,
      profit: 0,
      tier: "bronze",
      tax: 10,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: SellerID): Promise<Maybe<SellerRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : sellerRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getByEmail(email: Email): Promise<Maybe<SellerRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("email", "=", email.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : sellerRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByEmail error ${e}`)
      throw e
    })
}

export async function getByIDs(ids: SellerID[]): Promise<SellerRow[]> {
  const idStrings = ids.map((id) => id.unwrap())

  if (idStrings.length === 0) {
    return []
  }

  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "in", idStrings)
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(sellerRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.getByIDs error ${e}`)
      throw e
    })
}

export async function getByShopName(
  shopName: ShopName,
): Promise<Maybe<SellerRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("shopName", "=", shopName.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : sellerRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByShopName error ${e}`)
      throw e
    })
}

export async function listPendingVerification(): Promise<SellerRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .where("verified", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(sellerRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.listPendingVerification error ${e}`)
      throw e
    })
}

export async function listAll(): Promise<SellerRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .orderBy("profit", "desc")
    .execute()
    .then((rows) => JD.array(sellerRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.listAll error ${e}`)
      throw e
    })
}

export async function searchByShopName(query: string): Promise<SellerRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("shopName", "ilike", `%${query}%`)
    .where("isDeleted", "=", false)
    .where("active", "=", true)
    .execute()
    .then((rows) => JD.array(sellerRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.searchByShopName error ${e}`)
      throw e
    })
}

export async function count(): Promise<Nat> {
  return db
    .selectFrom(tableName)
    .select([(b) => b.fn.count("id").as("total")])
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((r) => natDecoder.verify(Number(r?.total)))
    .catch((e) => {
      Logger.error(`#${tableName}.count error ${e}`)
      throw e
    })
}
export async function updateVerified(
  id: SellerID,
  status: boolean,
): Promise<Maybe<SellerRow>> {
  return db
    .updateTable(tableName)
    .set({
      verified: status,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row ? sellerRowDecoder.verify(row) : null))
    .catch((e) => {
      Logger.error(`#${tableName}.updateVerified error: ${e}`)
      return null
    })
}

export async function approveSeller(id: SellerID): Promise<Maybe<SellerRow>> {
  return db
    .updateTable(tableName)
    .set({
      verified: true,
      active: true,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row == null ? null : sellerRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.approveSeller error: ${e}`)
      return null
    })
}
export async function updateShopProfile(
  id: SellerID,
  newShopName: ShopName,
  newShopDescription: Description,
): Promise<SellerRow> {
  const now = toDate(createNow())

  return db
    .updateTable(tableName)
    .set({
      shopName: newShopName.unwrap(),
      shopDescription: newShopDescription.unwrap(),
      updatedAt: now,
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerRowDecoder.verify)
    .catch((e: unknown) => {
      Logger.error(`#${tableName}.updateShopProfile error: ${e}`)
      throw e
    })
}

export async function updateWallet(
  id: SellerID,
  wallet: Wallet,
): Promise<SellerRow> {
  return db
    .updateTable(tableName)
    .set({
      wallet: wallet.unwrap(),
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerRowDecoder.verify)
    .catch((e: unknown) => {
      Logger.error(`#${tableName}.updateWallet error: ${e}`)
      throw e
    })
}

export async function syncTierAndTaxByProfit(id: SellerID): Promise<SellerRow> {
  const seller = await getByID(id)
  if (seller == null) {
    throw new Error("SELLER_NOT_FOUND")
  }

  const policy = await SellerTierPolicyRow.getOrCreate()
  const tierAndTax = SellerTierPolicyRow.tierAndTaxFromProfit(
    seller.profit,
    policy,
  )

  const currentTier = seller.tier.unwrap()
  const currentTax = seller.tax.unwrap()

  if (
    currentTier === tierAndTax.tier.unwrap() &&
    currentTax === tierAndTax.tax.unwrap()
  ) {
    return seller
  }

  return db
    .updateTable(tableName)
    .set({
      tier: tierAndTax.tier.unwrap(),
      tax: tierAndTax.tax.unwrap(),
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.syncTierAndTaxByProfit error: ${e}`)
      throw e
    })
}

export async function syncAllTierAndTaxByProfit(): Promise<void> {
  const policy = await SellerTierPolicyRow.getOrCreate()
  const sellers = await db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(sellerRowDecoder).verify(rows))

  for (const seller of sellers) {
    const tierAndTax = SellerTierPolicyRow.tierAndTaxFromProfit(
      seller.profit,
      policy,
    )

    if (
      seller.tier.unwrap() === tierAndTax.tier.unwrap() &&
      seller.tax.unwrap() === tierAndTax.tax.unwrap()
    ) {
      continue
    }

    await db
      .updateTable(tableName)
      .set({
        tier: tierAndTax.tier.unwrap(),
        tax: tierAndTax.tax.unwrap(),
        updatedAt: toDate(createNow()),
      })
      .where("id", "=", seller.id.unwrap())
      .where("isDeleted", "=", false)
      .executeTakeFirst()
  }
}
