import * as JD from "decoders"
import { Hash } from "../Data/Hash"
import { Email, emailDecoder } from "../../../Core/Data/User/Email"
import { Name, nameDecoder } from "../../../Core/App/BaseProfile/Name"
import {
  createUserID,
  UserID,
  userIDDecoder,
} from "../../../Core/App/BaseProfile/UserID"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { Wallet, walletDecoder } from "../../../Core/App/BaseProfile/Wallet"
import { Active, activeDecoder } from "../../../Core/App/BaseProfile/Active"
import { ShopName, shopNameDecoder } from "../../../Core/App/Seller/ShopName"
import { Verify, verifyDecoder } from "../../../Core/App/Seller/Verify"
import {
  VacationMode,
  vacationModeDecoder,
} from "../../../Core/App/Seller/VacationMode"
import { Revenue, revenueDecoder } from "../../../Core/App/Seller/Revenue"
import { Withdrawn, withdrawnDecoder } from "../../../Core/App/Seller/Withdrawn"
import { Profit, profitDecoder } from "../../../Core/App/Seller/Profit"
import db from "../Database"
import * as Logger from "../Logger"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"
import { Maybe } from "../../../Core/Data/Maybe"

const tableName = "seller"

export type SellerRow = {
  id: UserID
  email: Email
  name: Name
  password: string // hashed password
  wallet: Wallet
  active: Active
  shopName: ShopName
  verified: Verify
  vacationMode: VacationMode
  revenue: Revenue
  withdrawn: Withdrawn
  profit: Profit
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  email: Email
  name: Name
  hashedPassword: Hash
  shopName: ShopName
}

export async function create(params: CreateParams): Promise<SellerRow> {
  const { email, name, hashedPassword, shopName } = params

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
      shopName: shopName.unwrap(),
      verified: false, // Mặc định chưa verify khi mới tạo
      vacationMode: false, // Mặc định không bật kỳ nghỉ
      revenue: 0,
      withdrawn: 0,
      profit: 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: UserID): Promise<Maybe<SellerRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : sellerRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function getByEmail(email: Email): Promise<Maybe<SellerRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("email", "=", email.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : sellerRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByEmail error ${e}`)
      throw e
    })
}

export type UpdateParams = {
  name: Name
  email: Email
  shopName: ShopName
  vacationMode: VacationMode
  newHashedPassword: Maybe<Hash>
}

export async function update(
  id: UserID,
  params: UpdateParams,
): Promise<SellerRow> {
  const { name, email, shopName, vacationMode, newHashedPassword } = params

  const fields = {
    name: name.unwrap(),
    email: email.unwrap(),
    shopName: shopName.unwrap(),
    vacationMode: vacationMode.unwrap(),
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
    .then(sellerRowDecoder.verify)
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
export async function unsafeCreate(row: SellerRow): Promise<SellerRow> {
  return db
    .insertInto(tableName)
    .values({
      id: row.id.unwrap(),
      email: row.email.unwrap(),
      name: row.name.unwrap(),
      password: row.password,
      wallet: row.wallet.unwrap(),
      active: row.active.unwrap(),
      shopName: row.shopName.unwrap(),
      verified: row.verified.unwrap(),
      vacationMode: row.vacationMode.unwrap(),
      revenue: row.revenue.unwrap(),
      withdrawn: row.withdrawn.unwrap(),
      profit: row.profit.unwrap(),
      isDeleted: row.isDeleted,
      updatedAt: toDate(row.updatedAt),
      createdAt: toDate(row.createdAt),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(sellerRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.unsafeCreate error ${e}`)
      throw e
    })
}

export const sellerRowDecoder: JD.Decoder<SellerRow> = JD.object({
  id: userIDDecoder,
  email: emailDecoder,
  name: nameDecoder,
  password: JD.string,
  wallet: walletDecoder,
  active: activeDecoder,
  shopName: shopNameDecoder,
  verified: verifyDecoder,
  vacationMode: vacationModeDecoder,
  revenue: revenueDecoder,
  withdrawn: withdrawnDecoder,
  profit: profitDecoder,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})
