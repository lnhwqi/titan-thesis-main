import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "../../../Core/App/ProductVariant/ProductVariantID"
import { createNow, toDate } from "../../../Core/Data/Time/Timestamp"

const tableName = "user_cart_item"

export type UserCartItemRow = {
  userId: UserID
  productId: ProductID
  variantId: ProductVariantID
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export const userCartItemRowDecoder: JD.Decoder<UserCartItemRow> = JD.object({
  userId: userIDDecoder,
  productId: productIDDecoder,
  variantId: productVariantIDDecoder,
  quantity: JD.number,
  createdAt: JD.instanceOf(Date),
  updatedAt: JD.instanceOf(Date),
})

export async function addOrIncrement(
  userID: UserID,
  productID: ProductID,
  variantID: ProductVariantID,
): Promise<number> {
  const now = toDate(createNow())

  const existing = await db
    .selectFrom(tableName)
    .select(["quantity"])
    .where("userId", "=", userID.unwrap())
    .where("productId", "=", productID.unwrap())
    .where("variantId", "=", variantID.unwrap())
    .executeTakeFirst()
    .catch((e) => {
      Logger.error(`#${tableName}.addOrIncrement select error ${e}`)
      throw e
    })

  if (existing == null) {
    await db
      .insertInto(tableName)
      .values({
        userId: userID.unwrap(),
        productId: productID.unwrap(),
        variantId: variantID.unwrap(),
        quantity: 1,
        createdAt: now,
        updatedAt: now,
      })
      .execute()
      .catch((e) => {
        Logger.error(`#${tableName}.addOrIncrement insert error ${e}`)
        throw e
      })

    return 1
  }

  const nextQuantity = Number(existing.quantity) + 1

  await db
    .updateTable(tableName)
    .set({
      quantity: nextQuantity,
      updatedAt: now,
    })
    .where("userId", "=", userID.unwrap())
    .where("productId", "=", productID.unwrap())
    .where("variantId", "=", variantID.unwrap())
    .execute()
    .catch((e) => {
      Logger.error(`#${tableName}.addOrIncrement update error ${e}`)
      throw e
    })

  return nextQuantity
}

export async function getQuantity(
  userID: UserID,
  productID: ProductID,
  variantID: ProductVariantID,
): Promise<number | null> {
  return db
    .selectFrom(tableName)
    .select(["quantity"])
    .where("userId", "=", userID.unwrap())
    .where("productId", "=", productID.unwrap())
    .where("variantId", "=", variantID.unwrap())
    .executeTakeFirst()
    .then((row) => (row == null ? null : Number(row.quantity)))
    .catch((e) => {
      Logger.error(`#${tableName}.getQuantity error ${e}`)
      throw e
    })
}

export async function setQuantity(
  userID: UserID,
  productID: ProductID,
  variantID: ProductVariantID,
  quantity: number,
): Promise<boolean> {
  const now = toDate(createNow())

  return db
    .updateTable(tableName)
    .set({
      quantity,
      updatedAt: now,
    })
    .where("userId", "=", userID.unwrap())
    .where("productId", "=", productID.unwrap())
    .where("variantId", "=", variantID.unwrap())
    .executeTakeFirst()
    .then((row) => row.numUpdatedRows > 0n)
    .catch((e) => {
      Logger.error(`#${tableName}.setQuantity error ${e}`)
      throw e
    })
}

export async function remove(
  userID: UserID,
  productID: ProductID,
  variantID: ProductVariantID,
): Promise<boolean> {
  return db
    .deleteFrom(tableName)
    .where("userId", "=", userID.unwrap())
    .where("productId", "=", productID.unwrap())
    .where("variantId", "=", variantID.unwrap())
    .executeTakeFirst()
    .then((row) => row.numDeletedRows > 0n)
    .catch((e) => {
      Logger.error(`#${tableName}.remove error ${e}`)
      throw e
    })
}
