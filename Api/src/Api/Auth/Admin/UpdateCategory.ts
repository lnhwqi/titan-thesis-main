import * as API from "../../../../../Core/Api/Auth/Admin/UpdateCategory"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as CategoryRow from "../../../Database/CategoryRow"
import { isUniqueConstraintViolation } from "../../../Database"
import { toCategory } from "../../../App/Category"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const current = await CategoryRow.getByID(params.id)
  if (current == null) {
    return err("CATEGORY_NOT_FOUND")
  }

  try {
    const updated = await CategoryRow.update(params.id, {
      name: params.name,
      slug: params.slug,
      parentId: current.parentId,
    })

    return ok({
      category: toCategory(updated),
    })
  } catch (error: unknown) {
    if (error instanceof Error && isUniqueConstraintViolation(error)) {
      return err("SLUG_ALREADY_EXISTS")
    }

    throw error
  }
}
