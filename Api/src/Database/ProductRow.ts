import * as JD from "decoders"
import { Name, nameDecoder } from "../../../Core/App/Product/Name"
import { Price, priceDecoder } from "../../../Core/App/Product/Price"
import {
  Description,
  descriptionDecoder,
} from "../../../Core/App/Product/Description"
import {
  createProductID,
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import { SellerID, sellerIDDecoder } from "../../../Core/App/Seller/SellerID"

import {
  ProductAttributes,
  productAttributesDecoder,
} from "../../../Core/App/Product/Attributes"

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

const tableName = "product"

export type ProductRow = {
  id: ProductID
  sellerId: SellerID
  categoryId: string
  name: Name
  price: Price
  description: Description
  attributes: ProductAttributes
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  sellerId: SellerID
  categoryId: string
  name: Name
  price: Price
  description: Description
  attributes: ProductAttributes
}

export async function create(params: CreateParams): Promise<ProductRow> {
  const { sellerId, categoryId, name, price, description, attributes } = params

  const now = toDate(createNow())
  return db
    .insertInto(tableName)
    .values({
      id: createProductID().unwrap(),
      sellerId: sellerId.unwrap(),
      categoryId,
      name: name.unwrap(),
      price: price.unwrap(),
      description: description.unwrap(),

      attributes: attributes,

      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(
  productID: ProductID,
): Promise<Maybe<ProductRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", productID.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : productRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getByName(name: Name): Promise<Maybe<ProductRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("name", "=", name.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : productRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByName error ${e}`)
      throw e
    })
}

export async function getAll(): Promise<ProductRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(productRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.getAll error ${e}`)
      throw e
    })
}

export type UpdateParams = {
  name: Name
  price: Price
  description: Description
  attributes: ProductAttributes
}

export async function update(
  id: ProductID,
  params: UpdateParams,
): Promise<ProductRow> {
  const { name, price, description, attributes } = params

  const fields = {
    name: name.unwrap(),
    price: price.unwrap(),
    description: description.unwrap(),
    attributes: attributes,
    updatedAt: toDate(createNow()),
  }

  return db
    .updateTable(tableName)
    .set(fields)
    .where("id", "=", id.unwrap())
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.update error ${e}`)
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

export async function searchByName(name: string): Promise<ProductRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("name", "ilike", `%${name}%`)
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(productRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.searchByName error ${e}`)
      throw e
    })
}

/** Exported for testing */
export async function unsafeCreate(row: ProductRow): Promise<ProductRow> {
  return db
    .insertInto(tableName)
    .values({
      id: row.id.unwrap(),
      sellerId: row.sellerId.unwrap(),
      categoryId: row.categoryId,
      name: row.name.unwrap(),
      price: row.price.unwrap(),
      description: row.description.unwrap(),
      attributes: row.attributes,
      isDeleted: row.isDeleted,
      updatedAt: toDate(row.updatedAt),
      createdAt: toDate(row.createdAt),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.unsafeCreate error ${e}`)
      throw e
    })
}

export async function getFilteredAndSorted(params: {
  categoryID?: string
  name?: string
  page: number
  limit: number
  sortBy?: "price-low" | "price-high" | "newest" | "oldest"
}): Promise<{ rows: ProductRow[]; total: number }> {
  const { categoryID, name, page, limit, sortBy } = params
  const offset = (page - 1) * limit

  let query = db.selectFrom(tableName).selectAll()

  if (categoryID) {
    query = query.where("categoryId", "=", categoryID)
  }

  if (name) {
    query = query.where("name", "ilike", `%${name}%`)
  }

  query = query.where("isDeleted", "=", false)

  // Apply sorting
  if (sortBy === "price-low") {
    query = query.orderBy("price", "asc")
  } else if (sortBy === "price-high") {
    query = query.orderBy("price", "desc")
  } else if (sortBy === "newest") {
    query = query.orderBy("createdAt", "desc")
  } else if (sortBy === "oldest") {
    query = query.orderBy("createdAt", "asc")
  } else {
    query = query.orderBy("createdAt", "desc") // Default to newest
  }

  // Get total count before pagination
  let countQuery = db
    .selectFrom(tableName)
    .select([(b) => b.fn.count("id").as("total")])

  if (categoryID) {
    countQuery = countQuery.where("categoryId", "=", categoryID)
  }

  if (name) {
    countQuery = countQuery.where("name", "ilike", `%${name}%`)
  }

  countQuery = countQuery.where("isDeleted", "=", false)

  const [rows, countResult] = await Promise.all([
    query
      .limit(limit)
      .offset(offset)
      .execute()
      .then((data) => JD.array(productRowDecoder).verify(data)),
    countQuery
      .executeTakeFirst()
      .then((r) => natDecoder.verify(Number(r?.total ?? 0)).unwrap()),
  ])

  return { rows, total: countResult }
}

export const productRowDecoder: JD.Decoder<ProductRow> = JD.object({
  id: productIDDecoder,
  sellerId: sellerIDDecoder,
  categoryId: JD.string,
  name: nameDecoder,
  price: priceDecoder,
  description: descriptionDecoder,
  attributes: productAttributesDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})
