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

const tableName = "RefreshTokenRow"

const userTableName = "user_refresh_token"
const sellerTableName = "seller_refresh_token"
const adminTableName = "admin_refresh_token"

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

  try {
    switch (actorType) {
      case "USER":
        await db
          .insertInto(userTableName)
          .values({
            id: refreshToken.unwrap(),
            userId: actorID.unwrap(),
            previousId: refreshToken.unwrap(),
            previousCreatedAt: now,
            createdAt: now,
          })
          .executeTakeFirstOrThrow()
        break

      case "SELLER":
        await db
          .insertInto(sellerTableName)
          .values({
            id: refreshToken.unwrap(),
            sellerId: actorID.unwrap(),
            previousId: refreshToken.unwrap(),
            previousCreatedAt: now,
            createdAt: now,
          })
          .executeTakeFirstOrThrow()
        break

      case "ADMIN":
        await db
          .insertInto(adminTableName)
          .values({
            id: refreshToken.unwrap(),
            adminId: actorID.unwrap(),
            previousId: refreshToken.unwrap(),
            previousCreatedAt: now,
            createdAt: now,
          })
          .executeTakeFirstOrThrow()
        break
    }

    return refreshToken
  } catch (e) {
    Logger.error(`#${tableName}.create error ${e}`)
    throw e
  }
}

export async function replace(row: RefreshTokenRow): Promise<RefreshTokenRow> {
  const now = toDate(createNow())
  const refreshToken = createRefreshToken()

  try {
    switch (row.actorType) {
      case "USER": {
        const updated = await db
          .updateTable(userTableName)
          .set({
            id: refreshToken.unwrap(),
            previousId: row.id.unwrap(),
            previousCreatedAt: toDate(row.createdAt),
            createdAt: now,
          })
          .where("id", "=", row.id.unwrap())
          .where("userId", "=", row.actorID.unwrap())
          .returningAll()
          .executeTakeFirstOrThrow()

        return toRefreshTokenRow(updated, "USER")
      }

      case "SELLER": {
        const updated = await db
          .updateTable(sellerTableName)
          .set({
            id: refreshToken.unwrap(),
            previousId: row.id.unwrap(),
            previousCreatedAt: toDate(row.createdAt),
            createdAt: now,
          })
          .where("id", "=", row.id.unwrap())
          .where("sellerId", "=", row.actorID.unwrap())
          .returningAll()
          .executeTakeFirstOrThrow()

        return toRefreshTokenRow(updated, "SELLER")
      }

      case "ADMIN": {
        const updated = await db
          .updateTable(adminTableName)
          .set({
            id: refreshToken.unwrap(),
            previousId: row.id.unwrap(),
            previousCreatedAt: toDate(row.createdAt),
            createdAt: now,
          })
          .where("id", "=", row.id.unwrap())
          .where("adminId", "=", row.actorID.unwrap())
          .returningAll()
          .executeTakeFirstOrThrow()

        return toRefreshTokenRow(updated, "ADMIN")
      }
    }
  } catch (e) {
    Logger.error(`#${tableName}.replace error ${e}`)
    throw e
  }
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
  try {
    switch (actorType) {
      case "USER": {
        const row = await db
          .selectFrom(userTableName)
          .selectAll()
          .where("id", "=", refreshToken.unwrap())
          .where("userId", "=", actorID.unwrap())
          .executeTakeFirst()

        return row == null ? null : toRefreshTokenRow(row, "USER")
      }

      case "SELLER": {
        const row = await db
          .selectFrom(sellerTableName)
          .selectAll()
          .where("id", "=", refreshToken.unwrap())
          .where("sellerId", "=", actorID.unwrap())
          .executeTakeFirst()

        return row == null ? null : toRefreshTokenRow(row, "SELLER")
      }

      case "ADMIN": {
        const row = await db
          .selectFrom(adminTableName)
          .selectAll()
          .where("id", "=", refreshToken.unwrap())
          .where("adminId", "=", actorID.unwrap())
          .executeTakeFirst()

        return row == null ? null : toRefreshTokenRow(row, "ADMIN")
      }
    }
  } catch (e) {
    Logger.error(`#${tableName}.get error ${e}`)
    return null
  }
}

export async function getByPrevious(
  actorID: ActorID,
  actorType: ActorType,
  refreshToken: RefreshToken,
): Promise<RefreshTokenRow | null> {
  try {
    switch (actorType) {
      case "USER": {
        const row = await db
          .selectFrom(userTableName)
          .selectAll()
          .where("previousId", "=", refreshToken.unwrap())
          .where("userId", "=", actorID.unwrap())
          .executeTakeFirst()

        return row == null ? null : toRefreshTokenRow(row, "USER")
      }

      case "SELLER": {
        const row = await db
          .selectFrom(sellerTableName)
          .selectAll()
          .where("previousId", "=", refreshToken.unwrap())
          .where("sellerId", "=", actorID.unwrap())
          .executeTakeFirst()

        return row == null ? null : toRefreshTokenRow(row, "SELLER")
      }

      case "ADMIN": {
        const row = await db
          .selectFrom(adminTableName)
          .selectAll()
          .where("previousId", "=", refreshToken.unwrap())
          .where("adminId", "=", actorID.unwrap())
          .executeTakeFirst()

        return row == null ? null : toRefreshTokenRow(row, "ADMIN")
      }
    }
  } catch (e) {
    Logger.error(`#${tableName}.getByPrevious error ${e}`)
    return null
  }
}

export async function remove(
  actorID: ActorID,
  actorType: ActorType,
  refreshToken: RefreshToken,
): Promise<number> {
  try {
    switch (actorType) {
      case "USER":
        return db
          .deleteFrom(userTableName)
          .where("id", "=", refreshToken.unwrap())
          .where("userId", "=", actorID.unwrap())
          .executeTakeFirst()
          .then((r) => Number(r.numDeletedRows) || 0)

      case "SELLER":
        return db
          .deleteFrom(sellerTableName)
          .where("id", "=", refreshToken.unwrap())
          .where("sellerId", "=", actorID.unwrap())
          .executeTakeFirst()
          .then((r) => Number(r.numDeletedRows) || 0)

      case "ADMIN":
        return db
          .deleteFrom(adminTableName)
          .where("id", "=", refreshToken.unwrap())
          .where("adminId", "=", actorID.unwrap())
          .executeTakeFirst()
          .then((r) => Number(r.numDeletedRows) || 0)
    }
  } catch (e) {
    Logger.error(`#${tableName}.remove error ${e}`)
    throw e
  }
}

export async function removeAllByActor(
  actorID: ActorID,
  actorType: ActorType,
): Promise<number> {
  try {
    switch (actorType) {
      case "USER":
        return db
          .deleteFrom(userTableName)
          .where("userId", "=", actorID.unwrap())
          .executeTakeFirst()
          .then((r) => Number(r.numDeletedRows) || 0)

      case "SELLER":
        return db
          .deleteFrom(sellerTableName)
          .where("sellerId", "=", actorID.unwrap())
          .executeTakeFirst()
          .then((r) => Number(r.numDeletedRows) || 0)

      case "ADMIN":
        return db
          .deleteFrom(adminTableName)
          .where("adminId", "=", actorID.unwrap())
          .executeTakeFirst()
          .then((r) => Number(r.numDeletedRows) || 0)
    }
  } catch (e) {
    Logger.error(`#${tableName}.removeAllByActor error ${e}`)
    throw e
  }
}

export async function removeAllExpired(): Promise<number> {
  const lastCreatedAt = createTimestampE(
    createNow().unwrap() - refreshTokenExpiryMS,
  )

  if (lastCreatedAt._t === "Err") {
    Logger.error(`#${tableName}.removeAllExpired error ${lastCreatedAt.error}`)
    throw new Error(lastCreatedAt.error)
  }

  const cutoff = toDate(lastCreatedAt.value)

  try {
    const [u, s, a] = await Promise.all([
      db
        .deleteFrom(userTableName)
        .where("createdAt", "<=", cutoff)
        .executeTakeFirst(),
      db
        .deleteFrom(sellerTableName)
        .where("createdAt", "<=", cutoff)
        .executeTakeFirst(),
      db
        .deleteFrom(adminTableName)
        .where("createdAt", "<=", cutoff)
        .executeTakeFirst(),
    ])

    return (
      (Number(u.numDeletedRows) || 0) +
      (Number(s.numDeletedRows) || 0) +
      (Number(a.numDeletedRows) || 0)
    )
  } catch (e) {
    Logger.error(`#${tableName}.removeAllExpired error ${e}`)
    throw e
  }
}

/** For testing */
export async function _createExpired(
  actorID: ActorID,
  actorType: ActorType,
): Promise<RefreshToken> {
  const expiredCreatedAt = new Date(Date.now() - refreshTokenExpiryMS - 1000)
  const refreshToken = createRefreshToken()

  try {
    switch (actorType) {
      case "USER":
        await db
          .insertInto(userTableName)
          .values({
            id: refreshToken.unwrap(),
            userId: actorID.unwrap(),
            previousId: refreshToken.unwrap(),
            previousCreatedAt: expiredCreatedAt,
            createdAt: expiredCreatedAt,
          })
          .executeTakeFirstOrThrow()
        break

      case "SELLER":
        await db
          .insertInto(sellerTableName)
          .values({
            id: refreshToken.unwrap(),
            sellerId: actorID.unwrap(),
            previousId: refreshToken.unwrap(),
            previousCreatedAt: expiredCreatedAt,
            createdAt: expiredCreatedAt,
          })
          .executeTakeFirstOrThrow()
        break

      case "ADMIN":
        await db
          .insertInto(adminTableName)
          .values({
            id: refreshToken.unwrap(),
            adminId: actorID.unwrap(),
            previousId: refreshToken.unwrap(),
            previousCreatedAt: expiredCreatedAt,
            createdAt: expiredCreatedAt,
          })
          .executeTakeFirstOrThrow()
        break
    }

    return refreshToken
  } catch (e) {
    Logger.error(`#${tableName}._createExpired error ${e}`)
    throw e
  }
}

function buildActorID(val: string, type: ActorType): ActorID {
  if (type === "USER") return userIDDecoder.verify(val)
  if (type === "SELLER") return sellerIDDecoder.verify(val)
  return adminIDDecoder.verify(val)
}

const rawRowDecoder = JD.object({
  id: refreshTokenDecoder,
  previousId: refreshTokenDecoder,
  previousCreatedAt: JD.date.transform(fromDate),
  createdAt: JD.date.transform(fromDate),
})

const userActorDecoder = JD.object({ userId: JD.string })
const sellerActorDecoder = JD.object({ sellerId: JD.string })
const adminActorDecoder = JD.object({ adminId: JD.string })

function getActorIDRaw(rawRow: unknown, actorType: ActorType): string {
  switch (actorType) {
    case "USER":
      return userActorDecoder.verify(rawRow).userId
    case "SELLER":
      return sellerActorDecoder.verify(rawRow).sellerId
    case "ADMIN":
      return adminActorDecoder.verify(rawRow).adminId
  }
}

function toRefreshTokenRow(
  rawRow: unknown,
  actorType: ActorType,
): RefreshTokenRow {
  const row = rawRowDecoder.verify(rawRow)
  const actorIDRaw = getActorIDRaw(rawRow, actorType)

  return {
    id: row.id,
    previousID: row.previousId,
    previousCreatedAt: row.previousCreatedAt,
    actorID: buildActorID(actorIDRaw, actorType),
    actorType,
    createdAt: row.createdAt,
  }
}

export async function removeAllByUser(userID: UserID): Promise<number> {
  return removeAllByActor(userID, "USER")
}

export async function removeAllBySeller(sellerID: SellerID): Promise<number> {
  return removeAllByActor(sellerID, "SELLER")
}

export async function removeAllByAdmin(adminID: AdminID): Promise<number> {
  return removeAllByActor(adminID, "ADMIN")
}
