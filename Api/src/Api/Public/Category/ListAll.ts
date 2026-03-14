import * as API from "../../../../../Core/Api/Public/Category/ListAll"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as CategoryRow from "../../../Database/CategoryRow"
import * as CategoryTree from "../../../App/CategoryTree"
import { NoUrlParams } from "../../../../../Core/Data/Api"
import * as Logger from "../../../Logger"
export const contract = API.contract

export async function handler(
  _params: NoUrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  try {
    const rows = await CategoryRow.getAll()
    return ok(await getListPayload(rows))
  } catch (e) {
    Logger.warn(`#public.category.listAll fallback empty tree: ${e}`)
    return ok([])
  }
}

export async function getListPayload(
  rows: CategoryRow.CategoryRow[],
): Promise<API.Payload> {
  return CategoryTree.buildCategoryTree(rows)
}
