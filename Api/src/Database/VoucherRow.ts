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

import {
  VoucherID,
  voucherIDDecoder,
  createVoucherID,
} from "../../../Core/App/Voucher/VoucherID"
import { Name, nameDecoder } from "../../../Core/App/Voucher/Name"
import {
  ExpiryDate,
  expiryDateDecoder,
} from "../../../Core/App/Voucher/ExpiryDate"
import {
  DiscountValue,
  discountValueDecoder,
} from "../../../Core/App/Voucher/DiscountValue"
import {
  MinProductValue,
  minProductValueDecoder,
} from "../../../Core/App/Voucher/MinProductValue"
import { UserID } from "../../../Core/App/User/UserID"
import { createUUID } from "../../../Core/Data/UUID"

const tableName = "voucher"
const userVoucherTable = "user_voucher"

export type VoucherRow = {
  id: VoucherID
  name: Name
  expiryDate: ExpiryDate
  discountValue: DiscountValue
  minProductValue: MinProductValue
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export const voucherRowDecoder: JD.Decoder<VoucherRow> = JD.object({
  id: voucherIDDecoder,
  name: nameDecoder,

  expiryDate: JD.unknown.transform((v) => {
    // Nếu v đã là Date (từ Kysely), verify trực tiếp.
    // Nếu không, verify v (có thể là string từ API).
    return expiryDateDecoder.verify(v instanceof Date ? v : v)
  }),

  discountValue: discountValueDecoder,
  minProductValue: minProductValueDecoder,
  isDeleted: JD.boolean,

  updatedAt: JD.unknown.transform((v) => {
    // timestampJSDateDecoder thường yêu cầu Date object trong database row
    return timestampJSDateDecoder.verify(v instanceof Date ? v : v)
  }),

  createdAt: JD.unknown.transform((v) => {
    return timestampJSDateDecoder.verify(v instanceof Date ? v : v)
  }),
})

export type CreateParams = {
  name: Name
  expiryDate: ExpiryDate
  discountValue: DiscountValue
  minProductValue: MinProductValue
}

export async function create(params: CreateParams): Promise<VoucherRow> {
  const { name, expiryDate, discountValue, minProductValue } = params
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: createVoucherID().unwrap(),
      name: name.unwrap(),
      expiryDate: expiryDate.unwrap(),
      discountValue: discountValue.unwrap(),
      minProductValue: minProductValue.unwrap(),
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
      Logger.error(`#${tableName}.markAsUsed error ${e}`)
      throw e
    })
}
