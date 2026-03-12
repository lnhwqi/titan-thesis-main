import * as JD from "decoders"
import { Hash } from "../Data/Hash"
import { Email, emailDecoder } from "../../../Core/Data/User/Email"
import { Name, nameDecoder } from "../../../Core/App/Admin/Name"
import {
  createAdminID,
  AdminID,
  adminIDDecoder,
} from "../../../Core/App/Admin/AdminID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { Wallet, walletDecoder } from "../../../Core/App/Admin/Wallet"
import { Active, activeDecoder } from "../../../Core/App/Admin/Active"
import db from "../Database"
import * as Logger from "../Logger"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"
import { Maybe } from "../../../Core/Data/Maybe"

const tableName = "admin"

export type AdminRow = {
  id: AdminID
  email: Email
  name: Name
  password: string // hashed password
  wallet: Wallet
  active: Active
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  email: Email
  name: Name
  hashedPassword: Hash
}

export async function create(params: CreateParams): Promise<AdminRow> {
  const { email, name, hashedPassword } = params

  const now = toDate(createNow())
  return db
    .insertInto(tableName)
    .values({
      id: createAdminID().unwrap(),
      email: email.unwrap(),
      name: name.unwrap(),
      password: hashedPassword.unwrap(),
      wallet: 0,
      active: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(adminRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: AdminID): Promise<Maybe<AdminRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : adminRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getByEmail(email: Email): Promise<Maybe<AdminRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("email", "=", email.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : adminRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByEmail error ${e}`)
      throw e
    })
}

export type UpdateParams = {
  name: Name
  email: Email
  newHashedPassword: Maybe<Hash>
}

export async function update(
  id: AdminID,
  params: UpdateParams,
): Promise<AdminRow> {
  const { name, email, newHashedPassword } = params

  const fields = {
    name: name.unwrap(),
    email: email.unwrap(),
    updatedAt: toDate(createNow()),
  }

  const fieldsWithPassword =
    newHashedPassword != null
      ? { ...fields, password: newHashedPassword.unwrap() }
      : fields

  return db
    .updateTable(tableName)
    .set(fieldsWithPassword)
    .where("id", "=", id.unwrap())
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(adminRowDecoder.verify)
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
export async function unsafeCreate(row: AdminRow): Promise<AdminRow> {
  return db
    .insertInto(tableName)
    .values({
      id: row.id.unwrap(),
      email: row.email.unwrap(),
      name: row.name.unwrap(),
      password: row.password,
      wallet: row.wallet.unwrap(),
      active: row.active.unwrap(),
      isDeleted: row.isDeleted,
      updatedAt: toDate(row.updatedAt),
      createdAt: toDate(row.createdAt),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(adminRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.unsafeCreate error ${e}`)
      throw e
    })
}

export const adminRowDecoder: JD.Decoder<AdminRow> = JD.object({
  id: adminIDDecoder,
  email: emailDecoder,
  name: nameDecoder,
  password: JD.string,
  wallet: walletDecoder,
  active: activeDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})
