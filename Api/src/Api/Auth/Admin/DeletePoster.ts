import * as API from "../../../../../Core/Api/Auth/Admin/DeletePoster"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as PosterRow from "../../../Database/PosterRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const deleted = await PosterRow.deleteByID(params.id)
  if (deleted == null) {
    return err("POSTER_NOT_FOUND")
  }

  return ok({ id: params.id })
}
