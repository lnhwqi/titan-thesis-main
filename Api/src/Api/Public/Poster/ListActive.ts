import * as API from "../../../../../Core/Api/Public/Poster/ListActive"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as PosterRow from "../../../Database/PosterRow"
import { toPoster } from "../../../App/Poster"

export const contract = API.contract

export async function handler(): Promise<Result<API.ErrorCode, API.Payload>> {
  const active = await PosterRow.getActiveOrdered()

  return ok({ posters: active.map(toPoster) })
}
