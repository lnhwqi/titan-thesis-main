import * as API from "../../../../../Core/Api/Auth/Admin/ListPoster"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as PosterRow from "../../../Database/PosterRow"
import { toPoster } from "../../../App/Poster"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await PosterRow.getAll()
  return ok({ posters: rows.map(toPoster) })
}
