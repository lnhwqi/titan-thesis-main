import * as API from "../../../../../Core/Api/Auth/Admin/CreatePoster"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as PosterRow from "../../../Database/PosterRow"
import { toPoster } from "../../../App/Poster"
import { diffTimestamp } from "../../../../../Core/Data/Time/Timestamp"
import { toTimestamp } from "../../../../../Core/Data/Time/SDate"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.NoUrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (isDateRangeInvalid(params.startDate, params.endDate, params.isPermanent)) {
    return err("INVALID_DATE_RANGE")
  }

  const created = await PosterRow.create({
    name: params.name,
    description: params.description,
    imageUrl: params.imageUrl,
    imageScalePercent: params.imageScalePercent,
    imageOffsetXPercent: params.imageOffsetXPercent,
    imageOffsetYPercent: params.imageOffsetYPercent,
    startDate: params.startDate,
    endDate: params.isPermanent ? null : params.endDate,
    isPermanent: params.isPermanent,
  })

  return ok({
    poster: toPoster(created),
  })
}

function isDateRangeInvalid(
  startDate: API.BodyParams["startDate"],
  endDate: API.BodyParams["endDate"],
  isPermanent: boolean,
): boolean {
  if (isPermanent) {
    return false
  }

  if (endDate == null) {
    return true
  }

  return diffTimestamp(toTimestamp(endDate), toTimestamp(startDate)) < 0
}
