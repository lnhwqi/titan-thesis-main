import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { createNow, toDate } from "../../../Core/Data/Time/Timestamp"

const tableName = "user_wishlist_product"

export type UserWishlistProductRow = {
  userId: UserID
  productId: ProductID
  createdAt: Date
  updatedAt: Date
}

export const userWishlistProductRowDecoder: JD.Decoder<UserWishlistProductRow> =
  JD.object({
    userId: userIDDecoder,
    productId: productIDDecoder,
    createdAt: JD.instanceOf(Date),
    updatedAt: JD.instanceOf(Date),
  })

export async function listProductIDsByUserID(
  userID: UserID,
): Promise<ProductID[]> {
  return db
    .selectFrom(tableName)
    .select(["productId"])
    .where("userId", "=", userID.unwrap())
    .execute()
    .then((rows) => rows.map((row) => productIDDecoder.verify(row.productId)))
    .catch((e) => {
      Logger.error(`#${tableName}.listProductIDsByUserID error ${e}`)
      throw e
    })
}

export async function save(
  userID: UserID,
  productID: ProductID,
): Promise<void> {
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      userId: userID.unwrap(),
      productId: productID.unwrap(),
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((oc) =>
      oc.columns(["userId", "productId"]).doUpdateSet({ updatedAt: now }),
    )
    .execute()
    .then(() => undefined)
    .catch((e) => {
      Logger.error(`#${tableName}.save error ${e}`)
      throw e
    })
}

export async function remove(
  userID: UserID,
  productID: ProductID,
): Promise<void> {
  return db
    .deleteFrom(tableName)
    .where("userId", "=", userID.unwrap())
    .where("productId", "=", productID.unwrap())
    .execute()
    .then(() => undefined)
    .catch((e) => {
      Logger.error(`#${tableName}.remove error ${e}`)
      throw e
    })
}
