import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import { Nat, natDecoder } from "../../../Core/Data/Number/Nat"

const tableName = "market_config"
const singletonID = "default"
const defaultReportWindowHours = natDecoder.verify(72)

export type MarketConfigRow = {
  id: string
  reportWindowHours: Nat
  updatedAt: Timestamp
  createdAt: Timestamp
}

export const marketConfigRowDecoder: JD.Decoder<MarketConfigRow> = JD.object({
  id: JD.string,
  reportWindowHours: natDecoder,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})

export async function getOrCreate(): Promise<MarketConfigRow> {
  const existing = await db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", singletonID)
    .executeTakeFirst()

  if (existing != null) {
    return marketConfigRowDecoder.verify(existing)
  }

  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: singletonID,
      reportWindowHours: defaultReportWindowHours.unwrap(),
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(marketConfigRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.getOrCreate error ${e}`)
      throw e
    })
}

export async function updateReportWindowHours(
  reportWindowHours: Nat,
): Promise<MarketConfigRow> {
  const now = toDate(createNow())

  return db
    .updateTable(tableName)
    .set({
      reportWindowHours: reportWindowHours.unwrap(),
      updatedAt: now,
    })
    .where("id", "=", singletonID)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(marketConfigRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.updateReportWindowHours error ${e}`)
      throw e
    })
}
