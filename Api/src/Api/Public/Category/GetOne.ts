import * as API from "../../../../../Core/Api/Public/Category/GetOne"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as CategoryRow from "../../../Database/CategoryRow"
import { toCategory } from "../../../App/Category"
export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = params
  const row = await CategoryRow.getByID(id)

  if (row == null) {
    return err("CATEGORY_NOT_FOUND")
  }
  return ok(await getCategoryPayload(row))
}

export async function getCategoryPayload(
  row: CategoryRow.CategoryRow,
): Promise<API.Payload> {
  const childrenRows = await CategoryRow.getChildren(row.id)

  const category = toCategory(row)

  const children = childrenRows.map((childRow) => toCategory(childRow))

  category.children = children

  return category
}
