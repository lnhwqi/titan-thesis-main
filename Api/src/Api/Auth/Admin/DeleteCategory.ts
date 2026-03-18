import * as API from "../../../../../Core/Api/Auth/Admin/DeleteCategory"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as CategoryRow from "../../../Database/CategoryRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const deleted = await CategoryRow.deleteByID(params.id)
  if (deleted == null) {
    return err("CATEGORY_NOT_FOUND")
  }

  return ok({ id: params.id })
}
