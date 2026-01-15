import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { Maybe } from "../../../Core/Data/Maybe"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"

import {
  createCategoryID,
  CategoryID,
  categoryIDDecoder,
} from "../../../Core/App/Category/CategoryID"
import { Name, nameDecoder } from "../../../Core/App/Category/Name"
import { Slug, slugDecoder } from "../../../Core/App/Category/Slug"

const tableName = "category"

export type CategoryRow = {
  id: CategoryID
  name: Name
  slug: Slug
  parentId: Maybe<CategoryID>
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export const categoryRowDecoder: JD.Decoder<CategoryRow> = JD.object({
  id: categoryIDDecoder,
  name: nameDecoder,
  slug: slugDecoder,

  parentId: JD.nullable(categoryIDDecoder),

  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})

export type CreateParams = {
  name: Name
  slug: Slug
  parentId: Maybe<CategoryID>
}

export async function create(params: CreateParams): Promise<CategoryRow> {
  const { name, slug, parentId } = params
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: createCategoryID().unwrap(),
      name: name.unwrap(),
      slug: slug.unwrap(),
      parentId: parentId == null ? null : parentId.unwrap(),
      isDeleted: false,
      updatedAt: now,
      createdAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(categoryRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: CategoryID): Promise<Maybe<CategoryRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : categoryRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getBySlug(slug: Slug): Promise<Maybe<CategoryRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("slug", "=", slug.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : categoryRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getBySlug error ${e}`)
      throw e
    })
}

export async function getAll(): Promise<CategoryRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "asc")
    .execute()
    .then((rows) => rows.map((row) => categoryRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getAll error ${e}`)
      throw e
    })
}

export type UpdateParams = {
  name: Name
  slug: Slug
  parentId: Maybe<CategoryID>
}

export async function update(
  id: CategoryID,
  params: UpdateParams,
): Promise<CategoryRow> {
  const { name, slug, parentId } = params

  return db
    .updateTable(tableName)
    .set({
      name: name.unwrap(),
      slug: slug.unwrap(),
      parentId: parentId == null ? null : parentId.unwrap(),
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(categoryRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.update error ${e}`)
      throw e
    })
}
export async function getRoots(): Promise<CategoryRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("parentId", "is", null) // <--- QUAN TRỌNG: Chỉ lấy dòng không có cha
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "asc")
    .execute()
    .then((rows) => rows.map((row) => categoryRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getRoots error ${e}`)
      throw e
    })
}
export async function getChildren(
  parentId: CategoryID,
): Promise<CategoryRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("parentId", "=", parentId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "asc")
    .execute()
    .then((rows) => rows.map((row) => categoryRowDecoder.verify(row))) // Fix lỗi map
    .catch((e) => {
      Logger.error(`#${tableName}.getChildren error ${e}`)
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
