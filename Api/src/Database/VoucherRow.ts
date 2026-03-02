import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { Maybe } from "../../../Core/Data/Maybe"
import { createUUID } from "../../../Core/Data/UUID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { UserID, userIDDecoder } from "../../../Core/App/BaseProfile/UserID"
import {
  VoucherID,
  voucherIDDecoder,
  createVoucherID,
} from "../../../Core/App/Voucher/VoucherID"
import { Active, activeDecoder } from "../../../Core/App/Voucher/VoucherActive"
import {
  VoucherCode,
  voucherCodeDecoder,
} from "../../../Core/App/Voucher/VoucherCode"
import {
  VoucherDiscount,
  voucherDiscountDecoder,
} from "../../../Core/App/Voucher/VoucherDiscount"
import {
  ExpiredDate,
  expiredDateDecoder,
} from "../../../Core/App/Voucher/VoucherExpiredDate"
import {
  UsageLimit,
  usageLimitDecoder,
} from "../../../Core/App/Voucher/VoucherLimit"
import {
  MinOrderValue,
  minOrderValueDecoder,
} from "../../../Core/App/Voucher/VoucherMinOrderValue"
import {
  VoucherName,
  voucherNameDecoder,
} from "../../../Core/App/Voucher/VoucherName"
import {
  UsedCount,
  usedCountDecoder,
} from "../../../Core/App/Voucher/VoucherUsedCount"

const tableName = "voucher"
const userVoucherTable = "user_voucher"

// --- Types ---

export type VoucherRow = {
  id: VoucherID
  sellerId: UserID
  active: Active
  code: VoucherCode
  discount: VoucherDiscount
  expiredDate: ExpiredDate
  limit: UsageLimit
  minOrderValue: MinOrderValue
  name: VoucherName
  usedCount: UsedCount
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  sellerId: UserID
  code: VoucherCode
  name: VoucherName
  discount: VoucherDiscount
  limit: UsageLimit
  minOrderValue: MinOrderValue
  expiredDate: ExpiredDate
}

export type UpdateParams = Partial<
  Pick<VoucherRow, "name" | "limit" | "expiredDate" | "active">
>

export type ClaimResult =
  | "SUCCESS"
  | "NOT_FOUND"
  | "FULLY_CLAIMED"
  | "ALREADY_CLAIMED"
  | "SYSTEM_ERROR"

export type ApplyValidationResult =
  | { type: "SUCCESS"; voucher: VoucherRow }
  | { type: "NOT_FOUND" }
  | { type: "EXPIRED" }
  | { type: "MIN_VALUE_NOT_MET" }
  | { type: "ALREADY_USED" }

// --- Decoder ---

export const voucherRowDecoder: JD.Decoder<VoucherRow> = JD.object({
  id: voucherIDDecoder,
  sellerId: userIDDecoder,
  active: activeDecoder,
  code: voucherCodeDecoder,
  discount: voucherDiscountDecoder,
  limit: usageLimitDecoder,
  minOrderValue: minOrderValueDecoder,
  name: voucherNameDecoder,
  usedCount: usedCountDecoder,
  isDeleted: JD.boolean,
  expiredDate: JD.unknown.transform((v) =>
    expiredDateDecoder.verify(v instanceof Date ? v.getTime() : v),
  ),
  updatedAt: JD.unknown.transform((v) => timestampJSDateDecoder.verify(v)),
  createdAt: JD.unknown.transform((v) => timestampJSDateDecoder.verify(v)),
})

// --- Internal Helpers ---

const logError = (context: string, e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e)
  Logger.error(`#${tableName}.${context} error: ${msg}`)
}

const getExpirationTime = (date: unknown): number => {
  if (date instanceof Date) return date.getTime()
  if (typeof date === "number") return date
  if (typeof date === "string") return new Date(date).getTime()
  return 0
}

// --- Query Functions (SELECT) ---

export async function getByID(id: VoucherID): Promise<Maybe<VoucherRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row ? voucherRowDecoder.verify(row) : null))
    .catch((e) => {
      logError("getByID", e)
      throw e
    })
}

export async function getBySellerID(
  sellerId: UserID,
  filters: {
    minDiscount?: number
    maxDiscount?: number
    isExpired?: boolean
  } = {},
): Promise<VoucherRow[]> {
  let query = db
    .selectFrom(tableName)
    .selectAll()
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)

  if (filters.minDiscount !== undefined)
    query = query.where("discount", ">=", filters.minDiscount)
  if (filters.maxDiscount !== undefined)
    query = query.where("discount", "<=", filters.maxDiscount)
  if (filters.isExpired !== undefined) {
    const now = new Date()
    query = filters.isExpired
      ? query.where("expiredDate", "<", now)
      : query.where("expiredDate", ">=", now)
  }

  return query
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(voucherRowDecoder).verify(rows))
    .catch((e) => {
      logError("getBySellerID", e)
      throw e
    })
}

/**
 * Lấy danh sách Voucher User đang sở hữu (Trong ví)
 */
export async function getByUserID(userId: UserID): Promise<VoucherRow[]> {
  return db
    .selectFrom(tableName)
    .innerJoin(
      userVoucherTable,
      `${userVoucherTable}.voucherId`,
      `${tableName}.id`,
    )
    .selectAll(tableName)
    .where(`${userVoucherTable}.userId`, "=", userId.unwrap())
    .where(`${userVoucherTable}.isUsed`, "=", false)
    .where(`${tableName}.isDeleted`, "=", false)
    .execute()
    .then((rows) => JD.array(voucherRowDecoder).verify(rows))
    .catch((e) => {
      logError("getByUserID", e)
      throw e
    })
}

export async function getAllAvailable(): Promise<VoucherRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .where("active", "=", true)
    .where("expiredDate", ">", toDate(createNow()))
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(voucherRowDecoder).verify(rows))
    .catch((e) => {
      logError("getAllAvailable", e)
      throw e
    })
}

// --- Action Functions (INSERT / UPDATE / DELETE) ---

export async function create(params: CreateParams): Promise<VoucherRow> {
  const now = toDate(createNow())
  const newID = createVoucherID()

  return db
    .insertInto(tableName)
    .values({
      ...params,
      id: newID.unwrap(),
      sellerId: params.sellerId.unwrap(),
      active: true,
      code: params.code.unwrap(),
      name: params.name.unwrap(),
      discount: params.discount.unwrap(),
      limit: params.limit.unwrap(),
      minOrderValue: params.minOrderValue.unwrap(),
      expiredDate: new Date(params.expiredDate.unwrap()),
      usedCount: 0,
      isDeleted: false,
      updatedAt: now,
      createdAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(voucherRowDecoder.verify)
    .catch((e) => {
      logError("create", e)
      throw e
    })
}

export async function claimVoucher(
  userId: UserID,
  voucherId: VoucherID,
): Promise<ClaimResult> {
  const now = toDate(createNow())
  try {
    return await db.transaction().execute(async (trx) => {
      const voucher = await trx
        .selectFrom(tableName)
        .select(["limit", "usedCount", "expiredDate"])
        .where("id", "=", voucherId.unwrap())
        .where("isDeleted", "=", false)
        .where("active", "=", true)
        .forUpdate()
        .executeTakeFirst()

      if (!voucher) return "NOT_FOUND"
      if (getExpirationTime(voucher.expiredDate) <= Date.now())
        return "NOT_FOUND"
      if (voucher.usedCount >= voucher.limit) return "FULLY_CLAIMED"

      await trx
        .insertInto(userVoucherTable)
        .values({
          id: createUUID().unwrap(),
          userId: userId.unwrap(),
          voucherId: voucherId.unwrap(),
          isUsed: false,
          usedAt: null,
          createdAt: now,
        })
        .execute()

      await trx
        .updateTable(tableName)
        .set((eb) => ({ usedCount: eb("usedCount", "+", 1), updatedAt: now }))
        .where("id", "=", voucherId.unwrap())
        .execute()

      return "SUCCESS"
    })
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === "23505"
    )
      return "ALREADY_CLAIMED"
    logError("claimVoucher", e)
    return "SYSTEM_ERROR"
  }
}

export async function validateForApplying(
  userId: UserID,
  voucherId: VoucherID,
  orderValue: number,
): Promise<ApplyValidationResult> {
  const row = await db
    .selectFrom(tableName)
    .innerJoin(
      userVoucherTable,
      `${userVoucherTable}.voucherId`,
      `${tableName}.id`,
    )
    .selectAll(tableName)
    .select(`${userVoucherTable}.isUsed as userHasUsed`)
    .where(`${tableName}.id`, "=", voucherId.unwrap())
    .where(`${userVoucherTable}.userId`, "=", userId.unwrap())
    .where(`${tableName}.isDeleted`, "=", false)
    .where(`${tableName}.active`, "=", true)
    .executeTakeFirst()

  if (!row) return { type: "NOT_FOUND" }
  if (row.userHasUsed) return { type: "ALREADY_USED" }
  if (getExpirationTime(row.expiredDate) <= Date.now())
    return { type: "EXPIRED" }
  if (orderValue < row.minOrderValue) return { type: "MIN_VALUE_NOT_MET" }

  return { type: "SUCCESS", voucher: voucherRowDecoder.verify(row) }
}

export async function markAsUsed(
  userId: UserID,
  voucherId: VoucherID,
): Promise<void> {
  const now = toDate(createNow())
  await db
    .transaction()
    .execute(async (trx) => {
      const res = await trx
        .updateTable(userVoucherTable)
        .set({ isUsed: true, usedAt: now })
        .where("userId", "=", userId.unwrap())
        .where("voucherId", "=", voucherId.unwrap())
        .where("isUsed", "=", false)
        .executeTakeFirst()
      if (Number(res.numUpdatedRows) === 0)
        throw new Error("Voucher invalid or already used")
    })
    .catch((e) => {
      logError("markAsUsed", e)
      throw e
    })
}

/**
 * Hoàn trả Voucher nếu hủy đơn hàng
 */
export async function revertVoucher(
  userId: UserID,
  voucherId: VoucherID,
): Promise<void> {
  const now = toDate(createNow())
  await db
    .transaction()
    .execute(async (trx) => {
      const res = await trx
        .updateTable(userVoucherTable)
        .set({ isUsed: false, usedAt: null })
        .where("userId", "=", userId.unwrap())
        .where("voucherId", "=", voucherId.unwrap())
        .where("isUsed", "=", true)
        .executeTakeFirst()

      if (Number(res.numUpdatedRows) > 0) {
        await trx
          .updateTable(tableName)
          .set((eb) => ({ usedCount: eb("usedCount", "-", 1), updatedAt: now }))
          .where("id", "=", voucherId.unwrap())
          .execute()
      }
    })
    .catch((e) => {
      logError("revertVoucher", e)
      throw e
    })
}

export async function update(
  id: VoucherID,
  sellerId: UserID,
  params: UpdateParams,
): Promise<Maybe<VoucherRow>> {
  const now = toDate(createNow())
  const updateData = {
    updatedAt: now,
    ...(params.name && { name: params.name.unwrap() }),
    ...(params.limit && { limit: params.limit.unwrap() }),
    ...(params.active !== undefined && { active: params.active.unwrap() }),
    ...(params.expiredDate && {
      expiredDate: new Date(params.expiredDate.unwrap()),
    }),
  }
  return db
    .updateTable(tableName)
    .set(updateData)
    .where("id", "=", id.unwrap())
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row ? voucherRowDecoder.verify(row) : null))
    .catch((e) => {
      logError("update", e)
      throw e
    })
}

export async function softDelete(
  id: VoucherID,
  sellerId: UserID,
): Promise<boolean> {
  return db
    .updateTable(tableName)
    .set({ isDeleted: true, active: false, updatedAt: toDate(createNow()) })
    .where("id", "=", id.unwrap())
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((res) => Number(res.numUpdatedRows) > 0)
    .catch((e) => {
      logError("softDelete", e)
      throw e
    })
}
