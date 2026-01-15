import * as JD from "decoders"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import {
  CategoryID,
  categoryIDDecoder,
} from "../../../Core/App/Category/CategoryID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import db from "../Database"
import * as Logger from "../Logger"

const tableName = "productCategory"

export type ProductCategoryRow = {
  productID: ProductID
  categoryID: CategoryID
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  productID: ProductID
  categoryID: CategoryID
}

/**
 * Gắn sản phẩm vào một danh mục
 */
export async function create(
  params: CreateParams,
): Promise<ProductCategoryRow> {
  const { productID, categoryID } = params
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      productID: productID.unwrap(),
      categoryID: categoryID.unwrap(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productCategoryRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

/**
 * Lấy danh mục của một sản phẩm
 */
export async function getByProductID(
  productID: ProductID,
): Promise<ProductCategoryRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("productID", "=", productID.unwrap())
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(productCategoryRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.getByProductID error ${e}`)
      throw e
    })
}

export async function remove(
  productID: ProductID,
  categoryID: CategoryID,
): Promise<void> {
  await db
    .updateTable(tableName)
    .set({ isDeleted: true, updatedAt: toDate(createNow()) })
    .where("productID", "=", productID.unwrap())
    .where("categoryID", "=", categoryID.unwrap())
    .execute()
}

export const productCategoryRowDecoder: JD.Decoder<ProductCategoryRow> =
  JD.object({
    productID: productIDDecoder,
    categoryID: categoryIDDecoder,
    isDeleted: JD.boolean,
    updatedAt: timestampJSDateDecoder,
    createdAt: timestampJSDateDecoder,
  })

export async function getByProductIDs(
  productIDs: ProductID[],
): Promise<ProductCategoryRow[]> {
  const idStrings = productIDs.map((id) => id.unwrap())

  if (idStrings.length === 0) {
    return []
  }

  return db
    .selectFrom(tableName)
    .selectAll()
    .where("productID", "in", idStrings)
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => {
      return JD.array(productCategoryRowDecoder).verify(rows)
    })
    .catch((e) => {
      Logger.error(`#${tableName}.getByProductIDs error ${e}`)
      throw e
    })
}
