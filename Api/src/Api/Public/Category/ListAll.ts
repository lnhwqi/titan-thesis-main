import * as API from "../../../../../Core/Api/Public/Category/ListAll"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as CategoryRow from "../../../Database/CategoryRow"
import * as CategoryTree from "../../../App/CategoryTree"
import { NoUrlParams } from "../../../../../Core/Data/Api"
export const contract = API.contract

export async function handler(
  _params: NoUrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  try {
    const rows = await CategoryRow.getRoots()
    return ok(await getListPayload(rows))
  } catch (_e) {
    return err("CATEGORY_NOT_FOUND")
  }
}

export async function getListPayload(
  rows: CategoryRow.CategoryRow[],
): Promise<API.Payload> {
  return CategoryTree.buildCategoryTree(rows)
}
