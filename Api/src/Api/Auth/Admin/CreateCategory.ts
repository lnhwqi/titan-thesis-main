import * as API from "../../../../../Core/Api/Auth/Admin/CreateCategory"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as CategoryRow from "../../../Database/CategoryRow"
import { isUniqueConstraintViolation } from "../../../Database"
import { toCategory } from "../../../App/Category"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.NoUrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const parentID = params.parentID

  if (parentID != null) {
    const parent = await CategoryRow.getByID(parentID)
    if (parent == null) {
      return err("PARENT_CATEGORY_NOT_FOUND")
    }
  }

  try {
    const created = await CategoryRow.create({
      name: params.name,
      slug: params.slug,
      parentId: parentID,
    })

    return ok({
      category: toCategory(created),
    })
  } catch (error: unknown) {
    if (error instanceof Error && isUniqueConstraintViolation(error)) {
      return err("SLUG_ALREADY_EXISTS")
    }

    throw error
  }
}
