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
  name: Name
  price: Price
  description: Description
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  name: Name
  price: Price
  description: Description
}
export async function create(params: CreateParams): Promise<ProductRow> {
  const { name, price, description } = params

  const now = toDate(createNow())
  return db
    .insertInto(tableName)
    .values({
      id: createProductID().unwrap(),
      name: name.unwrap(),
      price: price.unwrap(),
      description: description.unwrap(),
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
}
export async function update(
  id: ProductID,
  params: UpdateParams,
): Promise<ProductRow> {
  const { name, price, description } = params

  const fields = {
    name: name.unwrap(),
    price: price.unwrap(),
    description: description.unwrap(),
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
    .executeTakeFirst()
    .then((r) => natDecoder.verify(Number(r?.total)))
    .catch((e) => {
      Logger.error(`#${tableName}.count error ${e}`)
      throw e
    })
}
export async function searchByName(name: string): Promise<ProductRow[]> {
  return db
    .selectFrom("product")
    .selectAll()
    .where("name", "ilike", `%${name}%`)
    .execute()
    .then((rows) => rows.map((row) => productRowDecoder.verify(row))) // <--- QUAN TRỌNG: verify để biến string thành ID Opaque
}

/** Exported for testing */
export async function unsafeCreate(row: ProductRow): Promise<ProductRow> {
  return db
    .insertInto(tableName)
    .values({
      id: row.id.unwrap(),
      name: row.name.unwrap(),
      price: row.price.unwrap(),
      description: row.description.unwrap(),
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

export const productRowDecoder: JD.Decoder<ProductRow> = JD.object({
  id: productIDDecoder,
  name: nameDecoder,
  price: priceDecoder,
  description: descriptionDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})
