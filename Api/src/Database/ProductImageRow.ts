import * as JD from "decoders"

import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import {
  createImageID,
  ImageID,
  imageIDDecoder,
} from "../../../Core/App/Product/ProductImageID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import db from "../Database"
import * as Logger from "../Logger"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"
import { Maybe } from "../../../Core/Data/Maybe"
import {
  ImageUrl,
  imageUrlDecoder,
} from "../../../Core/App/Product/ProductImageUrl"

const tableName = "productImage"

export type ProductImageRow = {
  id: ImageID
  productID: ProductID
  url: ImageUrl
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  productID: ProductID
  url: ImageUrl
}
export async function create(params: CreateParams): Promise<ProductImageRow> {
  const { productID, url } = params

  const now = toDate(createNow())
  return db
    .insertInto(tableName)
    .values({
      id: createImageID().unwrap(),
      productID: productID.unwrap(),
      url: url.unwrap(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productImageRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByProductID(
  productID: ProductID,
): Promise<Maybe<ProductImageRow[]>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("productID", "=", productID.unwrap())
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(productImageRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.getByProductID error ${e}`)
      throw e
    })
}

export type UpdateParams = {
  url: ImageUrl
}
export async function update(
  id: ImageID,
  params: UpdateParams,
): Promise<ProductImageRow> {
  const { url } = params

  const fields = {
    url: url.unwrap(),
    updatedAt: toDate(createNow()),
  }

  return db
    .updateTable(tableName)
    .set(fields)
    .where("id", "=", id.unwrap())
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productImageRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.update error ${e}`)
      throw e
    })
}

export async function count(): Promise<Nat> {
  return db
    .selectFrom(tableName)
    .select([(b) => b.fn.count("id").as("total")])
    .executeTakeFirst()
    .then((r) => natDecoder.verify(Number(r?.total)))
    .catch((e) => {
      Logger.error(`#${tableName}.count error ${e}`)
      throw e
    })
}

/** Exported for testing */
export async function unsafeCreate(
  row: ProductImageRow,
): Promise<ProductImageRow> {
  return db
    .insertInto(tableName)
    .values({
      id: row.id.unwrap(),
      url: row.url.unwrap(),
      productID: row.productID.unwrap(),
      isDeleted: row.isDeleted,
      updatedAt: toDate(row.updatedAt),
      createdAt: toDate(row.createdAt),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productImageRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.unsafeCreate error ${e}`)
      throw e
    })
}

export const productImageRowDecoder: JD.Decoder<ProductImageRow> = JD.object({
  id: imageIDDecoder,
  productID: productIDDecoder,
  url: imageUrlDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})
