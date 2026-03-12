import * as JD from "decoders"
import * as Logger from "../Logger"

import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { SellerID, sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import { AdminID, adminIDDecoder } from "../../../Core/App/Admin/AdminID"

import {
  createNow,
  createTimestampE,
  diffFromNow,
  fromDate,
  Timestamp,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import {
  createRefreshToken,
  RefreshToken,
  refreshTokenDecoder,
} from "../../../Core/Data/Security/RefreshToken"
import db from "../Database"

const tableName = "refresh_token"

export const refreshTokenExpiryMS = 90 * 24 * 60 * 60 * 1000

export type ActorType = "USER" | "SELLER" | "ADMIN"
export const actorTypeDecoder: JD.Decoder<ActorType> = JD.oneOf([
  "USER",
  "SELLER",
  "ADMIN",
])

export type ActorID = UserID | SellerID | AdminID

export type RefreshTokenRow = {
  id: RefreshToken
  previousID: RefreshToken
  previousCreatedAt: Timestamp
  actorID: ActorID
  actorType: ActorType
  createdAt: Timestamp
}

export async function create(
  actorID: ActorID,
  actorType: ActorType,
): Promise<RefreshToken> {
  const now = toDate(createNow())
  const refreshToken = createRefreshToken()

  return db
    .insertInto(tableName)
    .values({
      id: refreshToken.unwrap(),
      previousID: refreshToken.unwrap(),
      previousCreatedAt: now,
      actorID: actorID.unwrap(),
      actorType: actorType,
      createdAt: now,
    })
    .executeTakeFirstOrThrow()
    .then(() => refreshToken)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function replace(row: RefreshTokenRow): Promise<RefreshTokenRow> {
  const now = toDate(createNow())
  const refreshToken = createRefreshToken()
  return db
    .updateTable(tableName)
    .set({
      id: refreshToken.unwrap(),
      previousID: row.id.unwrap(),
      previousCreatedAt: toDate(row.createdAt),
      createdAt: now,
    })
    .where("id", "=", row.id.unwrap())
    .where("actorID", "=", row.actorID.unwrap())
    .where("actorType", "=", row.actorType)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(rowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.replace error ${e}`)
      throw e
    })
}

export function isExpired(row: RefreshTokenRow): boolean {
  return Math.abs(diffFromNow(row.createdAt)) > refreshTokenExpiryMS
}

export function isExpiredPrevious(row: RefreshTokenRow): boolean {
  return Math.abs(diffFromNow(row.previousCreatedAt)) > refreshTokenExpiryMS
}

export async function get(
  actorID: ActorID,
  actorType: ActorType,
  refreshToken: RefreshToken,
): Promise<RefreshTokenRow | null> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", refreshToken.unwrap())
    .where("actorID", "=", actorID.unwrap())
    .where("actorType", "=", actorType)
    .executeTakeFirstOrThrow()
    .then(rowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.get error ${e}`)
      return null
    })
}

export async function getByPrevious(
  actorID: ActorID,
  actorType: ActorType,
  refreshToken: RefreshToken,
): Promise<RefreshTokenRow | null> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("previousID", "=", refreshToken.unwrap())
    .where("actorID", "=", actorID.unwrap())
    .where("actorType", "=", actorType)
    .executeTakeFirstOrThrow()
    .then(rowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.getByPrevious error ${e}`)
      return null
    })
}

export async function remove(
  actorID: ActorID,
  actorType: ActorType,
  refreshToken: RefreshToken,
): Promise<number> {
  return db
    .deleteFrom(tableName)
    .where("id", "=", refreshToken.unwrap())
    .where("actorID", "=", actorID.unwrap())
    .where("actorType", "=", actorType)
    .executeTakeFirst()
    .then((r) => Number(r.numDeletedRows) || 0)
    .catch((e) => {
      Logger.error(`#${tableName}.remove error ${e}`)
      throw e
    })
}

export async function removeAllByActor(
  actorID: ActorID,
  actorType: ActorType,
): Promise<number> {
  return db
    .deleteFrom(tableName)
    .where("actorID", "=", actorID.unwrap())
    .where("actorType", "=", actorType)
    .executeTakeFirst()
    .then((r) => Number(r.numDeletedRows) || 0)
    .catch((e) => {
      Logger.error(`#${tableName}.removeAllByActor error ${e}`)
      throw e
    })
}

export async function removeAllExpired(): Promise<number> {
  const lastCreatedAt = createTimestampE(
    createNow().unwrap() - refreshTokenExpiryMS,
  )

  if (lastCreatedAt._t === "Err") {
    Logger.error(`#${tableName}.removeAllExpired error ${lastCreatedAt.error}`)
    throw new Error(lastCreatedAt.error)
  }

  return db
    .deleteFrom(tableName)
    .where("createdAt", "<=", toDate(lastCreatedAt.value))
    .executeTakeFirst()
    .then((r) => Number(r.numDeletedRows) || 0)
    .catch((e) => {
      Logger.error(`#${tableName}.removeAllExpired error ${e}`)
      throw e
    })
}

/** For testing */
export async function _createExpired(
  actorID: ActorID,
  actorType: ActorType,
): Promise<RefreshToken> {
  const expiredCreatedAt = new Date(Date.now() - refreshTokenExpiryMS - 1000)
  const refreshToken = createRefreshToken()
  return db
    .insertInto(tableName)
    .values({
      id: refreshToken.unwrap(),
      previousID: refreshToken.unwrap(),
      previousCreatedAt: expiredCreatedAt,
      actorID: actorID.unwrap(),
      actorType: actorType,
      createdAt: expiredCreatedAt,
    })
    .executeTakeFirstOrThrow()
    .then(() => refreshToken)
    .catch((e) => {
      Logger.error(`#${tableName}._createExpired error ${e}`)
      throw e
    })
}

function buildActorID(val: string, type: ActorType): ActorID {
  if (type === "USER") return userIDDecoder.verify(val)
  if (type === "SELLER") return sellerIDDecoder.verify(val)
  return adminIDDecoder.verify(val)
}

const rawRowDecoder = JD.object({
  id: refreshTokenDecoder,
  previousID: refreshTokenDecoder,
  previousCreatedAt: JD.date.transform(fromDate),
  actorID: JD.string,
  actorType: actorTypeDecoder,
  createdAt: JD.date.transform(fromDate),
})

export const rowDecoder: JD.Decoder<RefreshTokenRow> = rawRowDecoder.transform(
  (raw) => ({
    id: raw.id,
    previousID: raw.previousID,
    previousCreatedAt: raw.previousCreatedAt,
    actorID: buildActorID(raw.actorID, raw.actorType),
    actorType: raw.actorType,
    createdAt: raw.createdAt,
  }),
)
