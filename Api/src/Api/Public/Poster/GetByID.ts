import * as API from "../../../../../Core/Api/Public/Poster/GetByID"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as PosterRow from "../../../Database/PosterRow"
import { toPoster } from "../../../App/Poster"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const poster = await PosterRow.getByID(params.id)
  if (poster == null) {
    return err("POSTER_NOT_FOUND")
  }

  return ok({ poster: toPoster(poster) })
}
