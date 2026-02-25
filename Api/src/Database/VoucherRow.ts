import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { Maybe } from "../../../Core/Data/Maybe"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { UserID } from "../../../Core/App/BaseProfile/UserID"
import { createUUID } from "../../../Core/Data/UUID"

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

export type VoucherRow = {
  id: VoucherID
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

export const voucherRowDecoder: JD.Decoder<VoucherRow> = JD.object({
  id: voucherIDDecoder,
  active: activeDecoder,
  code: voucherCodeDecoder,
  discount: voucherDiscountDecoder,
  limit: usageLimitDecoder,
  minOrderValue: minOrderValueDecoder,
  name: voucherNameDecoder,
  usedCount: usedCountDecoder,
  isDeleted: JD.boolean,

  expiredDate: JD.unknown.transform((v) => {
    return expiredDateDecoder.verify(v instanceof Date ? v.getTime() : v)
  }),
  updatedAt: JD.unknown.transform((v) => {
    return timestampJSDateDecoder.verify(v instanceof Date ? v : v)
  }),
  createdAt: JD.unknown.transform((v) => {
    return timestampJSDateDecoder.verify(v instanceof Date ? v : v)
  }),
})

export type CreateParams = {
  code: VoucherCode
  name: VoucherName
  discount: VoucherDiscount
  limit: UsageLimit
  minOrderValue: MinOrderValue
  expiredDate: ExpiredDate
}

export async function create(params: CreateParams): Promise<VoucherRow> {
  const { code, name, discount, limit, minOrderValue, expiredDate } = params
  const now = toDate(createNow())
  const newID = createVoucherID()

  return db
    .insertInto(tableName)
    .values({
      id: newID.unwrap(),
      active: true,
      code: code.unwrap(),
      name: name.unwrap(),
      discount: discount.unwrap(),
      limit: limit.unwrap(),
      minOrderValue: minOrderValue.unwrap(),
      expiredDate: new Date(expiredDate.unwrap()),
      usedCount: 0,
      isDeleted: false,
      updatedAt: now,
      createdAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(voucherRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: VoucherID): Promise<Maybe<VoucherRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : voucherRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getAllAvailable(): Promise<VoucherRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .where("active", "=", true)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => rows.map((row) => voucherRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getAllAvailable error ${e}`)
      throw e
    })
}

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
    .where(`${tableName}.active`, "=", true)
    .execute()
    .then((rows) => rows.map((row) => voucherRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByUserID error ${e}`)
      throw e
    })
}

export async function claimVoucher(
  userId: UserID,
  voucherId: VoucherID,
): Promise<boolean> {
  const now = toDate(createNow())

  return db
    .insertInto(userVoucherTable)
    .values({
      id: createUUID().unwrap(),
      userId: userId.unwrap(),
      voucherId: voucherId.unwrap(),
      isUsed: false,
      usedAt: null,
      createdAt: now,
    })
    .executeTakeFirst()
    .then(() => true)
    .catch((e) => {
      Logger.error(`#${tableName}.claimVoucher error ${e}`)
      return false
    })
}

export async function markAsUsed(
  userId: UserID,
  voucherId: VoucherID,
): Promise<void> {
  const now = toDate(createNow())

  await db
    .updateTable(userVoucherTable)
    .set({
      isUsed: true,
      usedAt: now,
    })
    .where("userId", "=", userId.unwrap())
    .where("voucherId", "=", voucherId.unwrap())
    .where("isUsed", "=", false)
    .execute()
    .catch((e) => {
      Logger.error(`#${tableName}.markAsUsed user_voucher error ${e}`)
      throw e
    })

  await db
    .updateTable(tableName)
    .set((eb) => ({
      usedCount: eb("usedCount", "+", 1),
      updatedAt: now,
    }))
    .where("id", "=", voucherId.unwrap())
    .execute()
    .catch((e) => {
      Logger.error(`#${tableName}.markAsUsed voucher error ${e}`)
      throw e
    })
}
