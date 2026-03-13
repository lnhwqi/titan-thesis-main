import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { Maybe } from "../../../Core/Data/Maybe"
import { Hash } from "../Data/Hash"
import { Email, emailDecoder } from "../../../Core/Data/User/Email"
import { Name, nameDecoder } from "../../../Core/App/User/Name"
import {
  createUserID,
  UserID,
  userIDDecoder,
} from "../../../Core/App/User/UserID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { Wallet, walletDecoder } from "../../../Core/App/User/Wallet"
import { Active, activeDecoder } from "../../../Core/App/User/Active"
import { Points, pointsDecoder } from "../../../Core/App/User/Points"
import { Tier, tierDecoder } from "../../../Core/App/User/Tier"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"

const tableName = "user"

export type UserRow = {
  id: UserID
  email: Email
  name: Name
  password: string
  wallet: Wallet
  active: Active
  points: Points
  tier: Tier
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  email: Email
  name: Name
  hashedPassword: Hash
}

export const userRowDecoder: JD.Decoder<UserRow> = JD.object({
  id: userIDDecoder,
  email: emailDecoder,
  name: nameDecoder,
  password: JD.string,
  wallet: walletDecoder,
  active: activeDecoder,
  points: pointsDecoder,
  tier: tierDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})

export async function count(): Promise<Nat> {
  return db
    .selectFrom(tableName)
    .select((b) => b.fn.count("id").as("total"))
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((r) => natDecoder.verify(Number(r?.total ?? 0)))
    .catch((e) => {
      Logger.error(`#${tableName}.count error ${e}`)
      throw e
    })
}
export async function create(params: CreateParams): Promise<UserRow> {
  const { email, name, hashedPassword } = params
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: createUserID().unwrap(),
      email: email.unwrap(),
      name: name.unwrap(),
      password: hashedPassword.unwrap(),
      wallet: 0,
      active: true,
      points: 0,
      tier: "bronze",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(userRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: UserID): Promise<Maybe<UserRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row ? userRowDecoder.verify(row) : null))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getByEmail(email: Email): Promise<Maybe<UserRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("email", "=", email.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row ? userRowDecoder.verify(row) : null))
    .catch((e) => {
      Logger.error(`#${tableName}.getByEmail error ${e}`)
      throw e
    })
}
export async function unsafeCreate(row: UserRow): Promise<UserRow> {
  return db
    .insertInto(tableName)
    .values({
      id: row.id.unwrap(),
      email: row.email.unwrap(),
      name: row.name.unwrap(),
      password: row.password,
      wallet: row.wallet.unwrap(),
      active: row.active.unwrap(),
      points: row.points.unwrap(),
      tier: row.tier.unwrap(),
      isDeleted: row.isDeleted,
      updatedAt: toDate(row.updatedAt),
      createdAt: toDate(row.createdAt),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(userRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.unsafeCreate error ${e}`)
      throw e
    })
}

export type UpdateProfileParams = {
  name: Name
  email: Email
  newHashedPassword: Hash | null
}

export async function update(
  id: UserID,
  params: UpdateProfileParams,
): Promise<UserRow> {
  const now = toDate(createNow())

  const updateData: {
    name: string
    email: string
    updatedAt: Date
    password?: string
  } = {
    name: params.name.unwrap(),
    email: params.email.unwrap(),
    updatedAt: now,
  }

  if (params.newHashedPassword !== null) {
    updateData.password = params.newHashedPassword.unwrap()
  }

  return db
    .updateTable(tableName)
    .set(updateData)
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(userRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.update error ${e}`)
      throw e
    })
}
