import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import { Maybe, throwIfNull } from "../../../Core/Data/Maybe"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import {
  SDate,
  fromJsDateLocal,
  toJsDateLocal,
} from "../../../Core/Data/Time/SDate"
import {
  PosterID,
  createPosterID,
  posterIDDecoder,
} from "../../../Core/App/Poster/PosterID"
import {
  PosterName,
  posterNameDecoder,
} from "../../../Core/App/Poster/PosterName"
import {
  PosterDescription,
  posterDescriptionDecoder,
} from "../../../Core/App/Poster/PosterDescription"
import {
  ImageUrl,
  imageUrlDecoder,
} from "../../../Core/App/Product/ProductImageUrl"

const tableName = "poster"

export type PosterRow = {
  id: PosterID
  name: PosterName
  description: PosterDescription
  imageUrl: ImageUrl
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: SDate
  endDate: SDate | null
  isPermanent: boolean
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export const posterRowDecoder: JD.Decoder<PosterRow> = JD.object({
  id: posterIDDecoder,
  name: posterNameDecoder,
  description: posterDescriptionDecoder,
  imageUrl: imageUrlDecoder,
  imageScalePercent: JD.number,
  imageOffsetXPercent: JD.number,
  imageOffsetYPercent: JD.number,
  startDate: JD.date.transform((d) =>
    throwIfNull(
      fromJsDateLocal(d),
      `Invalid poster startDate: ${d.toISOString()}`,
    ),
  ),
  endDate: JD.nullable(
    JD.date.transform((d) =>
      throwIfNull(
        fromJsDateLocal(d),
        `Invalid poster endDate: ${d.toISOString()}`,
      ),
    ),
  ),
  isPermanent: JD.boolean,
  isDeleted: JD.boolean,
  updatedAt: timestampJSDateDecoder,
  createdAt: timestampJSDateDecoder,
})

export type CreateParams = {
  name: PosterName
  description: PosterDescription
  imageUrl: ImageUrl
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: SDate
  endDate: SDate | null
  isPermanent: boolean
}

export type UpdateParams = {
  name: PosterName
  description: PosterDescription
  imageUrl: ImageUrl
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: SDate
  endDate: SDate | null
  isPermanent: boolean
}

export async function create(params: CreateParams): Promise<PosterRow> {
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: createPosterID().unwrap(),
      name: params.name.unwrap(),
      description: params.description.unwrap(),
      imageUrl: params.imageUrl.unwrap(),
      imageScalePercent: params.imageScalePercent,
      imageOffsetXPercent: params.imageOffsetXPercent,
      imageOffsetYPercent: params.imageOffsetYPercent,
      startDate: toJsDateLocal(params.startDate),
      endDate: params.endDate == null ? null : toJsDateLocal(params.endDate),
      isPermanent: params.isPermanent,
      isDeleted: false,
      updatedAt: now,
      createdAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(posterRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.create error ${e}`)
      throw e
    })
}

export async function getByID(id: PosterID): Promise<Maybe<PosterRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : posterRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.getByID error ${e}`)
      throw e
    })
}

export async function update(
  id: PosterID,
  params: UpdateParams,
): Promise<PosterRow> {
  return db
    .updateTable(tableName)
    .set({
      name: params.name.unwrap(),
      description: params.description.unwrap(),
      imageUrl: params.imageUrl.unwrap(),
      imageScalePercent: params.imageScalePercent,
      imageOffsetXPercent: params.imageOffsetXPercent,
      imageOffsetYPercent: params.imageOffsetYPercent,
      startDate: toJsDateLocal(params.startDate),
      endDate: params.endDate == null ? null : toJsDateLocal(params.endDate),
      isPermanent: params.isPermanent,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(posterRowDecoder.verify)
    .catch((e) => {
      Logger.error(`#${tableName}.update error ${e}`)
      throw e
    })
}

export async function deleteByID(id: PosterID): Promise<Maybe<PosterRow>> {
  return db
    .deleteFrom(tableName)
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row == null ? null : posterRowDecoder.verify(row)))
    .catch((e) => {
      Logger.error(`#${tableName}.deleteByID error ${e}`)
      throw e
    })
}
